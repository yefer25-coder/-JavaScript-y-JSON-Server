// Simulated API URL for the 'products' collection
const URL_API = 'http://localhost:3000/products';

// HTML element references
const productList = document.getElementById('productList');
const messageDiv = document.getElementById('message');
const createProductForm = document.getElementById('createProductForm');
const updateProductForm = document.getElementById('updateProductForm');
const reloadProductsButton = document.getElementById('reloadProducts');

// Function to show user messages
function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    setTimeout(function () {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 3000);
}

// Function to validate product data
function validateProductData(product, isUpdate = false) {
    if (!product.name && !isUpdate) {
        return { isValid: false, message: 'Product name is required.' };
    }
    if (product.price !== undefined && (isNaN(product.price) || product.price <= 0)) {
        return { isValid: false, message: 'Price must be a positive number.' };
    }
    return { isValid: true, message: '' };
}

// GET: Fetch all products and display them
function fetchProducts() {
    console.log('Fetching products...');

    fetch(URL_API)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch products: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(products => {
            console.log('Products fetched:', products);
            displayProducts(products);
        })
        .catch(error => {
            console.error('GET request failed:', error);
            showMessage('Error loading products: ' + error.message, 'error');
        });
}

// Render product list in the HTML
function displayProducts(products) {
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = '<li>No products available.</li>';
        return;
    }

    products.forEach(product => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${product.name}</strong> (ID: ${product.id})<br>
                Price: $${product.price ? product.price.toFixed(2) : 'N/A'}<br>
                Description: ${product.description || 'No description'}
            </div>
            <div>
                <button class="update-button" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-description="${product.description || ''}">Edit</button>
                <button class="delete-button" data-id="${product.id}">Delete</button>
            </div>
        `;
        productList.appendChild(li);
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', event => {
            const id = event.target.dataset.id;
            deleteProduct(id);
        });
    });

    document.querySelectorAll('.update-button').forEach(button => {
        button.addEventListener('click', event => {
            const id = event.target.dataset.id;
            const name = event.target.dataset.name;
            const price = parseFloat(event.target.dataset.price);
            const description = event.target.dataset.description;

            document.getElementById('updateId').value = id;
            document.getElementById('updateName').value = name;
            document.getElementById('updatePrice').value = isNaN(price) ? '' : price;
            document.getElementById('updateDescription').value = description;
        });
    });
}

// POST: Create a new product
function createProduct(product) {
    const validation = validateProductData(product);
    if (!validation.isValid) {
        showMessage(validation.message, 'error');
        return;
    }

    console.log('Creating product:', product);

    fetch(URL_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error creating product: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(newProduct => {
            console.log('Product created:', newProduct);
            showMessage(`Product '${newProduct.name}' created successfully.`, 'success');
            fetchProducts();
        })
        .catch(error => {
            console.error('POST request failed:', error);
            showMessage('Error creating product: ' + error.message, 'error');
        });
}

// PUT: Update an existing product
function updateProduct(id, updatedFields) {
    if (!id) {
        showMessage('Product ID is required for update.', 'error');
        return;
    }

    const validation = validateProductData(updatedFields, true);
    if (!validation.isValid) {
        showMessage(validation.message, 'error');
        return;
    }

    const dataToUpdate = {};
    for (const key in updatedFields) {
        if (updatedFields[key] !== null && updatedFields[key] !== undefined && updatedFields[key] !== '') {
            dataToUpdate[key] = updatedFields[key];
        }
    }

    if (Object.keys(dataToUpdate).length === 0) {
        showMessage('No data to update.', 'error');
        return;
    }

    console.log('Updating product ID ' + id + ':', dataToUpdate);

    fetch(URL_API + '/' + id)
        .then(res => {
            if (!res.ok) throw new Error('Product not found');
            return res.json();
        })
        .then(existingProduct => {
            const finalProduct = {
                ...existingProduct,
                ...dataToUpdate
            };

            return fetch(URL_API + '/' + id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalProduct),
            });
        })
        .then(res => {
            if (!res.ok) throw new Error('Error updating product');
            return res.json();
        })
        .then(updated => {
            showMessage('Product updated successfully.', 'success');
            fetchProducts();
        })
        .catch(error => {
            console.error('Update failed:', error);
            showMessage('Error updating product: ' + error.message, 'error');
        });
}

// DELETE: Remove a product by ID
function deleteProduct(id) {
    if (!confirm(`Are you sure you want to delete product ID ${id}?`)) {
        return;
    }

    console.log('Deleting product ID: ' + id);

    fetch(URL_API + '/' + id, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Product not found.');
                }
                throw new Error('Error deleting product: ' + response.status + ' ' + response.statusText);
            }
            console.log('Product deleted.');
            showMessage(`Product ID ${id} deleted successfully.`, 'success');
            fetchProducts();
        })
        .catch(error => {
            console.error('DELETE request failed:', error);
            showMessage('Error deleting product: ' + error.message, 'error');
        });
}

// Handle product creation form submission
createProductForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('createName').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();

    fetch(URL_API)
        .then(res => res.json())
        .then(products => {
            let newId = 1;
            if (products.length > 0) {
                newId = Math.max(...products.map(p => parseInt(p.id))) + 1;
            }

            const newProduct = {
                id: newId.toString(),
                name: name,
                price: price,
                description: description
            };

            createProduct(newProduct);
            createProductForm.reset();
        })
        .catch(error => {
            console.error('Error generating new ID:', error);
            showMessage('Failed to auto-generate ID.', 'error');
        });
});

// Handle product update form submission
updateProductForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const id = document.getElementById('updateId').value.trim();
    const name = document.getElementById('updateName').value.trim();
    const price = parseFloat(document.getElementById('updatePrice').value);
    const description = document.getElementById('updateDescription').value.trim();

    const updatedFields = {};
    if (name) {
        updatedFields.name = name;
    }
    if (!isNaN(price)) {
        updatedFields.price = price;
    }
    if (description) {
        updatedFields.description = description;
    }

    updateProduct(id, updatedFields);
    updateProductForm.reset();
});

// Reload products on button click
reloadProductsButton.addEventListener('click', function () {
    fetchProducts();
});

// Fetch products on initial page load
document.addEventListener('DOMContentLoaded', function () {
    fetchProducts();
});
