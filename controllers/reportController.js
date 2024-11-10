const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const PDFDocument = require('pdfkit');

const reportController = {
  async getCustomerReport(req, res) {
    try {
        const customerId = parseInt(req.session.userId);
        const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
        
        // Get customer details
        const customer = await User.findOne({ userID: customerId });
        
        // First get all requests for this customer
        const requests = await Request.find({ customerID: customerId });
        
        // Then get all orders linked to these requests
        const orders = await Order.find({
            requestID: { $in: requests.map(req => req.requestID) }
        }).sort({ deliveryDate: 1 });

        // Calculate summary statistics
        const summary = {
          totalDeliveries: orders.length,
          cancelledDeliveries: orders.filter(o => o.status === 'Cancelled').length,
          averageOrderCost: 0, // Initialize to 0
          averageWeeklyDeliveries: Math.ceil(orders.length / 4),
      };
      
      // Calculate average order cost
      if (orders.length > 0) {
          const orderTotals = await Promise.all(orders.map(order => calculateOrderTotal(order)));
          const totalCost = orderTotals.reduce((sum, total) => sum + total, 0);
          summary.averageOrderCost = totalCost / orders.length;
      }

        // Get commonly bought items
        const itemCounts = {};
        for (const order of orders) {
            for (const item of order.items) {
                itemCounts[item.itemID] = (itemCounts[item.itemID] || 0) + item.quantity;
            }
        }

        // Get item details and sort by quantity
        const commonItems = await Promise.all(
            Object.entries(itemCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(async ([itemId]) => {
                    const item = await Item.findOne({ itemID: parseInt(itemId) });
                    return item ? item.itemName : 'Unknown Item';
                })
        );

        // Calculate order summary
        const orderSummary = await Promise.all(orders.map(async order => {
            const items = await Promise.all(order.items.map(async item => {
                const itemDetails = await Item.findOne({ itemID: item.itemID });
                return {
                    name: itemDetails ? itemDetails.itemName : 'Unknown Item',
                    quantity: item.quantity,
                    cost: item.quantity * (itemDetails ? itemDetails.itemPrice : 0)
                };
            }));

            // Find the corresponding request to get info if needed
            const request = requests.find(req => req.requestID === order.requestID);

            return {
                orderId: order.OrderID,
                requestDate: request ? request.requestDate : null,
                deliveryDate: order.deliveryDate,
                schedule: order.deliveryTimeRange,
                items: items.map(i => i.name).join(', '),
                payment: order.paymentMethod,
                total: items.reduce((sum, item) => sum + item.cost, 0)
            };
        }));

        // Calculate produce summary
        const produceSummary = [];
        for (const [itemId, quantity] of Object.entries(itemCounts)) {
            const itemDetails = await Item.findOne({ itemID: parseInt(itemId) });
            if (itemDetails) {
                produceSummary.push({
                    name: itemDetails.itemName,
                    quantity,
                    cost: quantity * itemDetails.itemPrice
                });
            }
        }

        res.render('reports/customer-report', {
            title: 'Monthly Order Report',
            css: ['report.css'],
            layout: 'report',
            month,
            customer,
            summary,
            commonItems: commonItems.join(', '),
            commonSchedule: getCommonSchedule(orders),
            orderSummary,
            produceSummary,
            totalAmount: produceSummary.reduce((sum, item) => sum + item.cost, 0),
            generatedDate: new Date().toLocaleDateString(),
            downloadUrl: `/reports/customer/${month}/download`
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Error generating report');
    }
},
async downloadCustomerReport(req, res) {
  try {
      const customerId = parseInt(req.session.userId);
      const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
      
      // Get customer details
      const customer = await User.findOne({ userID: customerId });
      
      // First get all requests for this customer
      const requests = await Request.find({ customerID: customerId });
      
      // Then get all orders linked to these requests
      const orders = await Order.find({
          requestID: { $in: requests.map(req => req.requestID) }
      }).sort({ deliveryDate: 1 });

      // Calculate summary statistics
      const summary = {
        totalDeliveries: orders.length,
        cancelledDeliveries: orders.filter(o => o.status === 'Cancelled').length,
        averageOrderCost: 0, // Initialize to 0
        averageWeeklyDeliveries: Math.ceil(orders.length / 4),
    };
    
    // Calculate average order cost
    if (orders.length > 0) {
        const orderTotals = await Promise.all(orders.map(order => calculateOrderTotal(order)));
        const totalCost = orderTotals.reduce((sum, total) => sum + total, 0);
        summary.averageOrderCost = totalCost / orders.length;
    }

      // Get commonly bought items
      const itemCounts = {};
      for (const order of orders) {
          for (const item of order.items) {
              itemCounts[item.itemID] = (itemCounts[item.itemID] || 0) + item.quantity;
          }
      }

      // Get item details and sort by quantity
      const commonItems = await Promise.all(
          Object.entries(itemCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(async ([itemId]) => {
                  const item = await Item.findOne({ itemID: parseInt(itemId) });
                  return item ? item.itemName : 'Unknown Item';
              })
      );

      // Calculate order summary
      const orderSummary = await Promise.all(orders.map(async order => {
          const items = await Promise.all(order.items.map(async item => {
              const itemDetails = await Item.findOne({ itemID: item.itemID });
              return {
                  name: itemDetails ? itemDetails.itemName : 'Unknown Item',
                  quantity: item.quantity,
                  cost: item.quantity * (itemDetails ? itemDetails.itemPrice : 0)
              };
          }));

          // Find the corresponding request
          const request = requests.find(req => req.requestID === order.requestID);

          return {
              orderId: order.OrderID,
              requestDate: request ? request.requestDate : null,
              deliveryDate: order.deliveryDate,
              schedule: order.deliveryTimeRange,
              items: items.map(i => i.name).join(', '),
              payment: order.paymentMethod,
              total: items.reduce((sum, item) => sum + item.cost, 0)
          };
      }));

      // Calculate produce summary
      const produceSummary = [];
      for (const [itemId, quantity] of Object.entries(itemCounts)) {
          const itemDetails = await Item.findOne({ itemID: parseInt(itemId) });
          if (itemDetails) {
              produceSummary.push({
                  name: itemDetails.itemName,
                  quantity,
                  cost: quantity * itemDetails.itemPrice
              });
          }
      }

      const totalAmount = produceSummary.reduce((sum, item) => sum + item.cost, 0);
      const commonSchedule = getCommonSchedule(orders);

      // Create the PDF document
      const doc = new PDFDocument({
          size: 'A4',
          margins: {
              top: 50,
              bottom: 50,
              left: 50,
              right: 50
          }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=order-report-${month.toLowerCase()}.pdf`);

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Generate the PDF content
      await generatePDF(doc, {
          month,
          customer,
          summary,
          commonItems: commonItems.join(', '),
          commonSchedule,
          orderSummary,
          produceSummary,
          totalAmount
      });

      // Finalize the PDF and end the stream
      doc.end();

  } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).send('Error downloading report');
  }
},
};

// Helper functions
async function calculateOrderTotal(order) {
  let total = 0;
  for (const orderItem of order.items) {
      const itemDetails = await Item.findOne({ itemID: orderItem.itemID });
      if (itemDetails) {
          total += orderItem.quantity * itemDetails.itemPrice;
      }
  }
  return total;
}

function getCommonSchedule(orders) {
    const schedules = {};
    orders.forEach(order => {
        schedules[order.deliveryTimeRange] = (schedules[order.deliveryTimeRange] || 0) + 1;
    });
    return Object.entries(schedules)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
}

// Add these utility functions after the existing helper functions but before module.exports

async function generatePDF(doc, data) {
  // A4 size = 595.28 x 841.89 points
  // With 40pt margins on each side, usable width = 515.28 points
  const pageWidth = 595.28;
  const margin = 40;
  const usableWidth = pageWidth - (margin * 2);

  // Set font and size
  doc.font('Helvetica');
  
  // Header
  doc.fontSize(16).text('SUSTAINABOWL', { align: 'center' });
  doc.fontSize(14).text('MONTHLY ORDER REPORT', { align: 'center' });
  doc.fontSize(12).text(`FOR MONTH ${data.month}`, { align: 'center' });
  doc.moveDown(2);

  // Customer Info
  doc.text(`FOR ${data.customer.name}`, margin, doc.y);
  doc.text(`TO ${data.customer.restaurantName || 'N/A'}`);
  doc.moveDown(2);

  // Summary Stats table
  const summaryColumnWidths = [usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.3, usableWidth * 0.3];
  let summaryHeaders = ['DELIVERIES', 'CANCELLED', 'AVE. ORDER COST', 'AVE. ORDERS WEEKLY'];
  let currentX = margin;
  let currentY = doc.y;

  // Draw summary headers
  summaryHeaders.forEach((header, i) => {
      doc.rect(currentX, currentY, summaryColumnWidths[i], 20).stroke();
      doc.text(header, currentX + 5, currentY + 5, {
          width: summaryColumnWidths[i] - 10,
          height: 20
      });
      currentX += summaryColumnWidths[i];
  });

  // Draw summary data
  currentX = margin;
  currentY += 20;
  const summaryData = [
      data.summary.totalDeliveries.toString(),
      data.summary.cancelledDeliveries.toString(),
      `P${data.summary.averageOrderCost.toFixed(2)}`,
      data.summary.averageWeeklyDeliveries.toString()
  ];

  summaryData.forEach((cell, i) => {
      doc.rect(currentX, currentY, summaryColumnWidths[i], 20).stroke();
      doc.text(cell, currentX + 5, currentY + 5, {
          width: summaryColumnWidths[i] - 10,
          height: 20
      });
      currentX += summaryColumnWidths[i];
  });

  doc.moveDown(3);

  // Commonly Bought and Schedule
  doc.text('COMMONLY BOUGHT:', margin);
  doc.text(data.commonItems, margin + 150, doc.y - doc.currentLineHeight());
  doc.moveDown();
  doc.text('COMMON SCHEDULE:', margin);
  doc.text(data.commonSchedule, margin + 150, doc.y - doc.currentLineHeight());
  doc.moveDown(2);

  // Order History
  doc.fontSize(12).text('ORDER HISTORY', margin);
  doc.moveDown();

  // Order History table
  const orderHeaders = ['ID', 'Requested', 'Delivered', 'Sched', 'Produce', 'Payment', 'Total'];
  const orderColumnWidths = [
      usableWidth * 0.1,  // ORDER ID
      usableWidth * 0.15, // REQUESTED
      usableWidth * 0.15, // DELIVERED
      usableWidth * 0.11,  // SCHEDULE
      usableWidth * 0.25, // PRODUCE
      usableWidth * 0.12, // PAYMENT
      usableWidth * 0.12   // TOTAL
  ];

  // Draw order headers
  currentX = margin;
  currentY = doc.y;
  orderHeaders.forEach((header, i) => {
      doc.rect(currentX, currentY, orderColumnWidths[i], 20).stroke();
      doc.text(header, currentX + 5, currentY + 5, {
          width: orderColumnWidths[i] - 10,
          height: 20
      });
      currentX += orderColumnWidths[i];
  });

  // Draw order data
  data.orderSummary.forEach(order => {
      currentX = margin;
      currentY += 20;

      if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = margin;
      }

      const rowData = [
          order.orderId,
          formatDate(order.requestDate),
          formatDate(order.deliveryDate),
          order.schedule,
          order.items,
          order.payment,
          `P${order.total.toFixed(2)}`
      ];

      rowData.forEach((cell, i) => {
          doc.rect(currentX, currentY, orderColumnWidths[i], 20).stroke();
          doc.text(cell.toString(), currentX + 5, currentY + 5, {
              width: orderColumnWidths[i] - 10,
              height: 20
          });
          currentX += orderColumnWidths[i];
      });
  });

  // Order History Total
  currentY += 30;
  doc.text(`TOTAL:`, usableWidth - 120 + margin, currentY);
  doc.text(`P${data.totalAmount.toFixed(2)}`, usableWidth - 90 + margin, currentY, { align: 'right' });

  // Add new page if needed
  if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = margin;
  } else {
      currentY += 40;
  }

  // Order Summary
  doc.text('ORDER SUMMARY', margin, currentY);
  doc.moveDown();

  // Summary table
  summaryHeaders = ['PRODUCE', 'KG ORDERED', 'COST'];
  const produceSummaryWidths = [usableWidth * 0.5, usableWidth * 0.25, usableWidth * 0.25];
  
  currentX = margin;
  currentY = doc.y;

  // Draw summary headers
  summaryHeaders.forEach((header, i) => {
      doc.rect(currentX, currentY, produceSummaryWidths[i], 20).stroke();
      doc.text(header, currentX + 5, currentY + 5, {
          width: produceSummaryWidths[i] - 10,
          height: 20
      });
      currentX += produceSummaryWidths[i];
  });

  // Draw summary data
  data.produceSummary.forEach(item => {
      currentX = margin;
      currentY += 20;
      
      const rowData = [
          item.name,
          item.quantity.toString(),
          `P${item.cost.toFixed(2)}`
      ];

      rowData.forEach((cell, i) => {
          doc.rect(currentX, currentY, produceSummaryWidths[i], 20).stroke();
          doc.text(cell, currentX + 5, currentY + 5, {
              width: produceSummaryWidths[i] - 10,
              height: 20
          });
          currentX += produceSummaryWidths[i];
      });
  });

  // Final Total
  currentY += 30;
  doc.text(`TOTAL:`, usableWidth - 120 + margin, currentY);
  doc.text(`P${data.totalAmount.toFixed(2)}`, usableWidth - 90 + margin, currentY, { align: 'right' });

  // Footer
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, margin, doc.page.height - 50);
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
  });
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function createTable(doc, data, columnWidths) {
  const cellPadding = 5;
  const lineHeight = 20;
  let y = doc.y;

  // Draw headers with background
  doc.fillColor('#f0f0f0');
  doc.rect(doc.x, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, lineHeight).fill();
  doc.fillColor('black');

  data.forEach((row, rowIndex) => {
      let x = doc.page.margins.left;
      
      // Check if we need to add a new page
      if (doc.y + lineHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.page.margins.top;
          // Redraw headers on new page
          if (rowIndex > 0) {
              createTableRow(doc, data[0], columnWidths, x, y, cellPadding, true);
              y += lineHeight;
          }
      }

      createTableRow(doc, row, columnWidths, x, y, cellPadding, rowIndex === 0);
      y += lineHeight;
      doc.y = y;
  });
}

function createTableRow(doc, rowData, columnWidths, x, y, padding, isHeader) {
  rowData.forEach((cell, i) => {
      const width = columnWidths[i];
      // Draw cell border
      doc.rect(x, y, width, 20).stroke();
      
      // Add text with padding
      doc.fontSize(isHeader ? 10 : 9);
      doc.text(
          cell.toString(),
          x + padding,
          y + padding,
          {
              width: width - (padding * 2),
              align: i === rowData.length - 1 ? 'right' : 'left'
          }
      );
      x += width;
  });
}


module.exports = reportController;