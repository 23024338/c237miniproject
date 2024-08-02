const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// create mysql connection 
const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'cagApp'
    host: 'mysql-isabel.alwaysdata.net',
    user: 'isabel',
    password: 'M!ngfrom669558',
    database: 'isabel_cagdatabase'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({
    extended: false
}));

// define routes
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM products';
    // fetch data from mysql
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving products');
        }
        // render html page with data
        res.render('index', {products: results});
    });
});

app.get('/product/:id', (req, res) => {
    // extract the product ID from the request parameters
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    // Fetch data from MySQL based on the product ID
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving products by ID');
        }
        // check if any product with the given ID was found
        if (results.length > 0) {
            // render HTML page with the product data
            res.render('product', { product: results[0] });
        } else {
            // if no product with the given id was found, render a 404 page or handle it accordingly
            res.status(404).send('Product not found');
        }
    });
});

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', upload.single('image'), (req, res) => {
    // extract product data from the request body
    const { name, quantity, price } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
    // Insert the new product into the database
    connection.query(sql, [name, quantity, price, image], (error, results) => {
        if (error) {
            // handle any error that occurs during the database operation
            console.error("Error adding product:", error);
            res.status(500).send('Error adding product');
        } else {
            // send a success response
            res.redirect('/');
        }
    });
});

app.get('/edit/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    // fetch data from mysql based on the product id
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving product by ID');
        }
        // check if any product with the given id was found
        if (results.length > 0) {
            // render html page with the product data
            res.render('edit', { product: results[0] });
        } else {
            // if no product with the given id was found, render a 404 page or handle it accordingly
            res.status(404).send('Product not found');
        }
    });
})

app.post('/edit/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    // extract product data from the request body
    const { name, quantity, price } = req.body;
    let image = req.body.currentImage; // retrieve current image filename
    if (req.file) { // if new image is uploaded
        image = req.file.filename; //set image to be new image filename
    }

    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?';

    // insert the new product into the database
    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) {
            // handle any error that occurs during the database operation
            console.error('Database query error:', error);
            res.status(500).send('Error updating product');
        } else {
            // send a success response
            res.redirect('/');
        }
    });
})

app.get('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM products WHERE productId = ?';
    connection.query( sql , [productId], (error, results) => {
        if (error) {
            // handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            // send a success response
            res.redirect('/');
        }
    });
});

app.get('/search', (req, res) => {
    const query = req.query.query.toLowerCase();
    const sql = 'SELECT * FROM products WHERE LOWER(productName) LIKE ?';
    connection.query(sql, [`%${query}%`], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving search results');
        }
        res.render('search', { products: results });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


