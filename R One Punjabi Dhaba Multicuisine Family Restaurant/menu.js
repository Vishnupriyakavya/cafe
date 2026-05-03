// menu.js - Logic for Mobile-First Menu Page Cart and Interactions

const menuData = {}; 
let cart = {}; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate menuData from DOM
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        const id = item.dataset.id;
        menuData[id] = {
            id: id,
            name: item.dataset.name,
            price: parseFloat(item.dataset.price)
        };
    });

    // 2. Load cart from localStorage
    const savedCart = localStorage.getItem('r1dhaba_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = {};
        }
    }

    // 3. Setup ScrollSpy for Category Tabs
    setupScrollSpy();

    // 4. Tab Click behavior
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.dataset.target;
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                const headerOffset = 110; 
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Handle incoming anchor links on load
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetSection = document.getElementById(targetId);
        if(targetSection) {
            setTimeout(() => {
                const headerOffset = 110; 
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }, 100);
        }
    }

    // Initial render
    updateCartUI();
});

// --- Scroll Spy Logic ---
function setupScrollSpy() {
    const sections = document.querySelectorAll('.menu-section');
    const tabs = document.querySelectorAll('.tab');
    const tabContainer = document.querySelector('.category-tabs');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150; 
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        if (!current && scrollY > 0 && sections.length > 0) {
            current = sections[0].getAttribute('id');
        }

        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.target === current) {
                tab.classList.add('active');
                const tabLeft = tab.offsetLeft;
                const tabWidth = tab.clientWidth;
                const containerWidth = tabContainer.clientWidth;
                const scrollPos = tabLeft - (containerWidth / 2) + (tabWidth / 2);
                tabContainer.scrollTo({
                    left: scrollPos,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// --- Cart Logic ---
function saveCart() {
    localStorage.setItem('r1dhaba_cart', JSON.stringify(cart));
}

function addToCart(id) {
    if (!cart[id]) {
        cart[id] = {
            ...menuData[id],
            qty: 1
        };
    }
    updateCartUI();
}

function updateQty(id, change) {
    if (cart[id]) {
        cart[id].qty += change;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        updateCartUI();
    }
}

function updateCartUI() {
    saveCart();

    let totalItems = 0;
    let totalPrice = 0;

    for (const id in cart) {
        totalItems += cart[id].qty;
        totalPrice += cart[id].qty * cart[id].price;
    }

    document.getElementById('header-cart-badge').innerText = totalItems;

    const stickyBar = document.getElementById('sticky-cart');
    if (totalItems > 0) {
        stickyBar.classList.add('visible');
        document.getElementById('sticky-item-count').innerText = `${totalItems} item${totalItems > 1 ? 's' : ''} added`;
        document.getElementById('sticky-total-price').innerText = `₹${totalPrice}`;
    } else {
        stickyBar.classList.remove('visible');
        if (document.getElementById('cart-modal').classList.contains('active')) {
            toggleCartModal(); // close if emptied
        }
    }

    for (const id in menuData) {
        const controlsDiv = document.getElementById(`controls-${id}`);
        if (!controlsDiv) continue;

        if (cart[id]) {
            controlsDiv.innerHTML = `
                <div class="qty-controls">
                    <button class="btn-qty" onclick="updateQty('${id}', -1)">-</button>
                    <span class="qty-val">${cart[id].qty}</span>
                    <button class="btn-qty" onclick="updateQty('${id}', 1)">+</button>
                </div>
            `;
        } else {
            controlsDiv.innerHTML = `<button class="btn-add-init" onclick="addToCart('${id}')">ADD</button>`;
        }
    }

    updateModalContents(totalItems, totalPrice);
}

// --- Cart Modal UI ---
function toggleCartModal() {
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        if (Object.keys(cart).length === 0) return;
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }
}

function updateModalContents(totalItems, totalPrice) {
    const container = document.getElementById('cart-items-container');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const footer = document.querySelector('.cart-footer');

    if (totalItems === 0) {
        container.innerHTML = '';
        emptyMsg.style.display = 'block';
        footer.style.display = 'none';
        return;
    }

    emptyMsg.style.display = 'none';
    footer.style.display = 'block';
    
    let html = '';
    for (const id in cart) {
        const item = cart[id];
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="price">₹${item.price * item.qty}</span>
                </div>
                <div class="cart-item-controls">
                    <div class="add-controls">
                        <div class="qty-controls">
                            <button class="btn-qty" onclick="updateQty('${id}', -1)">-</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="btn-qty" onclick="updateQty('${id}', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    document.getElementById('modal-item-total').innerText = `₹${totalPrice}`;
    document.getElementById('modal-grand-total').innerText = `₹${totalPrice}`;
}

// --- Checkout ---
function checkout() {
    if (Object.keys(cart).length === 0) return;

    let text = "Hi, I want to order:%0A%0A";
    let total = 0;

    for (const id in cart) {
        const item = cart[id];
        text += `${item.qty}x ${item.name} - ₹${item.price * item.qty}%0A`;
        total += item.price * item.qty;
    }

    text += `%0ATotal: ₹${total}%0A%0APlease confirm and share delivery details.`;

    const waLink = `https://wa.me/919876543210?text=${text}`;
    window.open(waLink, '_blank');
}
