const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const path = require('path');
const { promisify } = require('util');
const app = express();
const port = 3000;
const ejs = require('ejs');

// Middleware to parse form data and JSON bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')))


// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to display the form
app.get('/', (req, res) => {
    res.render('services');
});             

// Route to handle form submission and generate quote
app.post('/generate-quote', async (req, res) => {
    const { customerName, services } = req.body;
    console.log("Name", customerName);
    console.log("Serviced", services);
    // console.log("Response", res.body);
    const currentDate = new Date().toLocaleDateString();
    let servicesArray = Array.isArray(services) ? services : [services];
    // console.log("Services Array", servicesArray);
    servicesArray = servicesArray.map(service => JSON.parse(service));
    // Calculate total cost
    const totalCost = servicesArray.reduce((sum, service) => sum + service.cost, 0);
    const renderView = promisify(res.render).bind(res);

    // Render the quote HTML
    try{

    
    // const quoteHtml = await res.render('quote', { customerName, services: servicesArray, currentDate }, { async: true });
    const quoteHtml = await ejs.renderFile(path.join(__dirname, 'views', 'quote.ejs'), {
        customerName,
        services: servicesArray,
        currentDate,
        totalCost
    });

    // Generate PDF from HTML
    console.time('Generate PDF');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(quoteHtml);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    // console.log("Quote HTML", quoteHtml);
    await browser.close();
    console.timeEnd('Generate PDF');

    // Send PDF to client for download
    res.setHeader('Content-Disposition', 'attachment;filename=quote.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
}catch (error) {
    console.error("Error generating quote:", error);
    res.status(500).send("An error occurred while generating the quote.");
}
});

// Start the server
app.listen(port, () => {
    console.log(`VisionKraft quote generator app listening at http://localhost:${port}`);
});