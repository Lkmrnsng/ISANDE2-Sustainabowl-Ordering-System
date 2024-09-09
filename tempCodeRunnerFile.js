app.get('/', (req, res) => {
    res.render('index', {
        title: "Uniride",
        css: ["index.css"], 
        layout: "main",
        messages: req.flash('error')
    });
});
