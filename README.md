# Web AR Book Experience

An interactive web AR experience that allows users to scan a QR code and view a book in augmented reality. Users can navigate through the book's pages using on-screen controls and toggle between AR and normal viewing modes.

## Features

- QR code scanning to initiate AR experience
- 3D book visualization anchored to QR code
- Page turning animations in AR
- Toggle between AR and normal book viewing modes
- Responsive design for mobile devices
- Touch gesture support for navigation

## Technologies Used

- A-Frame for 3D/AR rendering
- AR.js for marker-based augmented reality
- Turn.js for book page-flipping effect
- HTML5-QRCode.js for QR code scanning
- jQuery for DOM manipulation

## Setup Instructions

1. Clone this repository
2. Host on a local or remote HTTPS server (AR requires HTTPS)
3. Open in a modern mobile browser
4. Print the QR code from `/assets/markers/qr-marker.png`
5. Scan the QR code with the app to begin the AR experience

## Project Structure

- `index.html` - Main application entry point
- `/css` - Styling for the application
- `/js` - JavaScript modules for app functionality
- `/assets` - Images, QR codes, and book content
- `/lib` - External libraries

## Creating Your Own Book

1. Add your book pages as images in `/assets/books/your-book-name/`
2. Create a new QR code with format `book:your-book-name`
3. Modify the `fetchBookData` function in `app.js` to include your book data

## License

MIT License
