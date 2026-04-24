const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

const footerBgCss = `

/* Footer dengan background image untuk index dan about */
.main-footer.footer-bg-image {
    background: url('./images/bg-ruangan.png') no-repeat center center;
    background-size: cover;
    position: relative;
    color: #fff;
}

.main-footer.footer-bg-image::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    z-index: 0;
}

.main-footer.footer-bg-image .footer-container,
.main-footer.footer-bg-image .footer-bottom {
    position: relative;
    z-index: 1;
}

.main-footer.footer-bg-image .footer-col h4 {
    color: #d4a742;
}

.main-footer.footer-bg-image .footer-col ul li a {
    color: #ccc;
}

.main-footer.footer-bg-image .footer-col ul li a:hover {
    color: #d4a742;
}

.main-footer.footer-bg-image .footer-desc {
    color: #ddd;
}

.main-footer.footer-bg-image .contact-info p {
    color: #ddd;
}

.main-footer.footer-bg-image .footer-copyright p,
.main-footer.footer-bg-image .footer-copyright a {
    color: #aaa;
}

.main-footer.footer-bg-image hr {
    border-color: #444;
}`;

// Insert before the responsive footer media query
const insertPoint = '/* Responsif HP */';
if (css.includes(insertPoint)) {
    css = css.replace(insertPoint, footerBgCss + '\n\n/* Responsif HP */');
    fs.writeFileSync('style.css', css);
    console.log('Footer background CSS added successfully');
} else {
    console.log('Insert point not found');
}
