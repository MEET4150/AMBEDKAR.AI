// Ambedkar AI Landing Page JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functionality
    initNavbar();
    initSmoothScrolling();
    initDemo();
    initCTAButtons();
    initMobileNavigation();
    initScrollAnimations();
    
    // Sample responses for demo
    const sampleResponses = {
        "What are my rights as a tenant in Delhi?": {
            response: "As a tenant in Delhi, you have several important rights under the Delhi Rent Control Act:\n\n• Right to fair rent and protection against arbitrary increases\n• Right to security of tenure - you cannot be evicted without proper legal grounds\n• Right to basic amenities like water, electricity, and sanitation\n• Right to privacy and peaceful enjoyment of the property\n• Right to receive proper notice before any rent increase\n\nWould you like me to explain any specific tenant right in more detail?",
            delay: 2000
        },
        "How do I file a consumer complaint?": {
            response: "Filing a consumer complaint in India involves these steps:\n\n1. **Gather Evidence**: Collect bills, receipts, warranties, and correspondence\n2. **Choose the Right Forum**:\n   - District Forum: Claims up to ₹1 crore\n   - State Commission: Claims ₹1-10 crores\n   - National Commission: Claims above ₹10 crores\n3. **File Online**: Use the e-Daakhil portal (edaakhil.nic.in)\n4. **Pay Fees**: Minimal court fees based on claim amount\n5. **Attend Hearings**: Present your case with evidence\n\nThe process typically takes 3-5 months. Need help with any specific step?",
            delay: 2500
        },
        "What documents are needed for property registration?": {
            response: "For property registration in India, you'll need:\n\n**From Seller:**\n• Original sale deed/title documents\n• Encumbrance certificate\n• Property tax receipts\n• NOC from society/builder\n• Identity and address proof\n\n**From Buyer:**\n• PAN card and Aadhaar card\n• Address proof\n• Passport-size photographs\n\n**Common Documents:**\n• Sale agreement\n• Property valuation certificate\n• Stamp duty payment receipt\n• Registration fees\n\n**Additional (if applicable):**\n• Home loan NOC\n• Power of attorney (if using agent)\n\nEnsure all documents are verified before registration. Need help with any specific document?",
            delay: 2200
        },
        "How to register a startup in India?": {
            response: "To register a startup in India, follow these steps:\n\n**1. Choose Business Structure:**\n• Private Limited Company (most common)\n• LLP (Limited Liability Partnership)\n• Partnership Firm\n\n**2. Reserve Company Name:**\n• Check availability on MCA portal\n• Submit RUN application\n\n**3. Obtain Required Documents:**\n• Director's PAN and Aadhaar\n• Address proof for registered office\n• MOA and AOA drafts\n\n**4. File Incorporation:**\n• SPICe+ form on MCA portal\n• Pay government fees\n• Get Certificate of Incorporation\n\n**5. Post-Incorporation:**\n• Open business bank account\n• Apply for GSTIN if required\n• Register for startup India (optional benefits)\n\nTotal time: 15-20 days. Cost: ₹15,000-25,000. Need detailed guidance on any step?",
            delay: 2800
        }
    };
    
    // Navbar scroll effect
    function initNavbar() {
        const navbar = document.getElementById('mainNav');
        
        if (navbar) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }
    
    // Smooth scrolling for navigation links - FIXED
    function initSmoothScrolling() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const navbarToggler = document.querySelector('.navbar-toggler');
                        if (navbarToggler) {
                            navbarToggler.click();
                        }
                    }
                }
            });
        });
    }
    
    // Demo chat functionality - FIXED
    function initDemo() {
        const demoInput = document.getElementById('demoInput');
        const demoSendBtn = document.getElementById('demoSendBtn');
        const demoMessages = document.getElementById('demoMessages');
        const questionBtns = document.querySelectorAll('.question-btn');
        
        if (!demoInput || !demoSendBtn || !demoMessages) {
            console.log('Demo elements not found');
            return;
        }
        
        // Handle question button clicks
        questionBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const question = this.getAttribute('data-question');
                if (question) {
                    sendDemoMessage(question);
                }
            });
        });
        
        // Handle send button click
        demoSendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const message = demoInput.value.trim();
            if (message) {
                sendDemoMessage(message);
            }
        });
        
        // Handle enter key in input
        demoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const message = this.value.trim();
                if (message) {
                    sendDemoMessage(message);
                }
            }
        });
        
        function sendDemoMessage(message) {
            // Clear input
            demoInput.value = '';
            
            // Add user message
            addMessageToDemo(message, 'user');
            
            // Show typing indicator
            const typingIndicator = addTypingIndicator();
            
            // Get response (check if it's a sample question or generic response)
            const responseData = sampleResponses[message] || {
                response: "Thank you for your question! This is a demo of Ambedkar AI. In the full version, I would provide detailed legal guidance specific to your query based on Indian law. Our AI analyzes your question and provides contextual, accurate legal information.\n\nTo get started with real legal assistance, please sign up for Ambedkar AI. I'm here to help with all your legal questions!",
                delay: 1500
            };
            
            // Simulate AI thinking time
            setTimeout(() => {
                if (typingIndicator && typingIndicator.parentNode) {
                    typingIndicator.parentNode.removeChild(typingIndicator);
                }
                addMessageToDemo(responseData.response, 'bot');
            }, responseData.delay);
        }
        
        function addMessageToDemo(message, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            // Handle line breaks in message
            messageContent.innerHTML = message.replace(/\n/g, '<br>');
            
            messageDiv.appendChild(messageContent);
            demoMessages.appendChild(messageDiv);
            
            // Scroll to bottom smoothly
            setTimeout(() => {
                demoMessages.scrollTop = demoMessages.scrollHeight;
            }, 100);
        }
        
        function addTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot-message typing-message';
            
            const typingContent = document.createElement('div');
            typingContent.className = 'message-content typing-indicator';
            typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            
            typingDiv.appendChild(typingContent);
            demoMessages.appendChild(typingDiv);
            
            // Scroll to bottom
            setTimeout(() => {
                demoMessages.scrollTop = demoMessages.scrollHeight;
            }, 100);
            
            return typingDiv;
        }
    }
    
    // CTA Button functionality - FIXED
    function initCTAButtons() {
        const primaryCtaButtons = document.querySelectorAll('#primaryCta, #ctaNavBtn, #finalCta');
        const secondaryCtaButtons = document.querySelectorAll('#secondaryCta');
        const learnMoreBtn = document.getElementById('learnMoreBtn');
        
        // Primary CTA buttons - Get Started/Sign Up
        primaryCtaButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    showModal('Get Started with Ambedkar AI', 'Thank you for your interest in Ambedkar AI! Our platform is currently in development phase.\n\nWe are building comprehensive AI-powered legal assistance for the Indian legal system. Sign up for early access and be the first to experience the future of legal accessibility.\n\nFeatures coming soon:\n• AI Legal Guidance in Hindi & English\n• Document Analysis & Insights\n• 24/7 Legal Support\n• Connection with Verified Lawyers');
                });
            }
        });
        
        // Secondary CTA buttons - Try Demo
        secondaryCtaButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Scroll to demo section
                    const demoSection = document.getElementById('demo');
                    if (demoSection) {
                        const headerOffset = 80;
                        const elementPosition = demoSection.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        });
        
        // Learn More button
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Scroll to features section
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                    const headerOffset = 80;
                    const elementPosition = featuresSection.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }
    
    // Mobile navigation
    function initMobileNavigation() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            // Close mobile menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                }
            });
        }
    }
    
    // Simple modal function for demonstrations - FIXED
    function showModal(title, message) {
        // Remove any existing modals
        const existingModal = document.querySelector('.custom-modal-overlay');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        // Create modal elements
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'custom-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--color-surface);
            padding: 32px;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--color-border);
            animation: slideIn 0.3s ease;
        `;
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        modalTitle.style.cssText = `
            margin-bottom: 16px;
            color: var(--color-text);
            font-weight: 600;
            font-size: 1.25rem;
        `;
        
        const modalText = document.createElement('p');
        modalText.innerHTML = message.replace(/\n/g, '<br>');
        modalText.style.cssText = `
            margin-bottom: 24px;
            color: var(--color-text-secondary);
            line-height: 1.6;
        `;
        
        const modalButton = document.createElement('button');
        modalButton.textContent = 'Close';
        modalButton.className = 'btn btn--primary';
        modalButton.style.cssText = `
            width: 100%;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: var(--color-primary);
            color: var(--color-btn-primary-text);
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;
        
        modalButton.addEventListener('click', function() {
            modalOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(modalOverlay)) {
                    document.body.removeChild(modalOverlay);
                }
            }, 300);
        });
        
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(modalOverlay)) {
                        document.body.removeChild(modalOverlay);
                    }
                }, 300);
            }
        });
        
        // Handle escape key
        const handleEscape = function(e) {
            if (e.key === 'Escape') {
                modalOverlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(modalOverlay)) {
                        document.body.removeChild(modalOverlay);
                    }
                }, 300);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalText);
        modalContent.appendChild(modalButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus the button for accessibility
        setTimeout(() => modalButton.focus(), 100);
        
        // Add CSS animations if not already added
        if (!document.querySelector('#modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Add scroll animations
    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.feature-card, .step-card, .benefit-card, .testimonial-card');
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
    
    // Add some interactive feedback - IMPROVED
    const interactiveElements = document.querySelectorAll('.btn, .feature-card, .question-btn');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
                this.style.transition = 'transform 0.2s ease';
            }
        });
        
        el.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Market Analysis Information (for reference)
    const marketAnalysis = {
        viability: "HIGH - Strong market potential",
        marketSize: "The Indian legal services market is valued at approximately $2.8 billion and is growing at 7-8% annually",
        legalTechGrowth: "Legal tech adoption in India has increased by 40% post-COVID",
        targetAudience: [
            "Individual citizens seeking legal guidance",
            "Small businesses needing compliance help",
            "Students and legal professionals",
            "Rural populations with limited legal access"
        ],
        challenges: [
            "Language barriers in legal understanding",
            "High cost of legal consultation (₹1000-5000 per hour)",
            "Limited access to legal services in rural areas",
            "Complex legal procedures and documentation"
        ],
        opportunities: [
            "350+ million smartphone users seeking digital solutions",
            "Government push for Digital India initiatives",
            "Growing awareness of legal rights among citizens",
            "Increasing small business legal compliance needs",
            "Gap in affordable legal tech solutions"
        ],
        competitors: [
            "Vakilsearch (₹2000+ for services)",
            "LegalKart (consultation-based model)", 
            "LegalDesk (document services)",
            "MyAdvo (lawyer marketplace)"
        ],
        competitiveAdvantage: [
            "AI-powered guidance in multiple Indian languages",
            "Focus on Dr. B.R. Ambedkar's vision of justice accessibility",
            "Comprehensive legal knowledge base for Indian laws",
            "Bridge between AI assistance and professional legal services",
            "Affordable pricing model targeting mass market"
        ],
        businessModel: [
            "Freemium: Basic AI guidance free, premium features paid",
            "Subscription: Monthly/yearly plans for regular users",
            "Commission: Revenue share with partner lawyers",
            "Document services: Paid document review and drafting"
        ],
        marketValidation: "POSITIVE - Legal tech is a growing sector in India with significant unmet demand"
    };
    
    // Console log for development reference
    console.log('🚀 Ambedkar AI - Market Analysis:', marketAnalysis);
    console.log('✅ Landing page initialized successfully!');
    console.log('🎯 Market Verdict: This project has STRONG potential in the Indian market');
    
});