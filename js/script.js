(function(){
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* Native-feeling press feedback where the device supports it. */
  const hapticTargets = "button, .btn, .text-link";
  const lastHaptic = new WeakMap();
  function triggerHaptic(target){
    if (!("vibrate" in navigator)) return;
    const now = performance.now();
    if (now - (lastHaptic.get(target) || 0) < 80) return;
    lastHaptic.set(target, now);
    navigator.vibrate(8);
  }
  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(hapticTargets);
    if (target) triggerHaptic(target);
  }, { passive: true });
  document.addEventListener("click", (event) => {
    const target = event.target.closest(hapticTargets);
    if (target) triggerHaptic(target);
  });

  /* =========================================================
     Theme toggle (in-memory only — no persistence by design)
     ========================================================= */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
  });

  /* =========================================================
     Scroll progress bar + nav shadow + hero parallax
     ========================================================= */
  const scrollBar = document.getElementById("scrollBar");
  const navEl = document.getElementById("siteNav");
  const heroGlowEl = document.querySelector(".hero__glow");
  function updateScrollBar(){
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    scrollBar.style.width = scrolled + "%";
    navEl.classList.toggle("is-scrolled", h.scrollTop > 8);
    if (heroGlowEl && !prefersReduced) {
      heroGlowEl.style.transform = `translateY(${h.scrollTop * 0.15}px)`;
    }
  }
  document.addEventListener("scroll", updateScrollBar, { passive: true });

  /* mouse-follow spotlight in the hero */
  const heroSection = document.querySelector(".hero");
  if (heroSection && !prefersReduced) {
    heroSection.addEventListener("pointermove", (e) => {
      const r = heroSection.getBoundingClientRect();
      heroSection.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      heroSection.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  }

  /* =========================================================
     Mobile nav
     ========================================================= */
  const nav = document.getElementById("siteNav");
  const burger = document.getElementById("navBurger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".nav__mobile a").forEach(a => {
    a.addEventListener("click", () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded","false"); });
  });

  /* Keep the section link in sync with the reader's position. */
  const navLinks = [...document.querySelectorAll(".nav__links a[href^='#']")];
  const navSections = navLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (navLinks.length && navSections.length) {
    const sectionIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle(
          "is-active",
          link.getAttribute("href") === "#" + entry.target.id
        ));
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
    navSections.forEach(section => sectionIo.observe(section));
  }

  /* =========================================================
     Reveal-on-scroll
     ========================================================= */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  /* =========================================================
     Hero "live edit" headline — draft struck through, then
     the final line rises in gold. Embodies the AI-draft ->
     human-edit brand story. Falls back to static text if
     reduced motion is requested.
     ========================================================= */
  const line1 = document.getElementById("editLine1");
  const line2 = document.getElementById("editLine2");

  function wordsSpan(text){
    return text.split(" ").map(w => `<span class="word">${w}</span>`).join(" ");
  }

  if (line1 && line2 && prefersReduced) {
    line1.innerHTML = wordsSpan("Words that build trust.");
    line2.innerHTML = wordsSpan("Copy that drives action.");
  } else if (line1 && line2) {
    const draft1 = "Text that sounds okay.";
    const final1 = "Words that build trust.";
    const draft2 = "Copy that sort of works.";
    const final2 = "Copy that drives action.";

    function runEdit(el, draftText, finalText, delay){
      el.innerHTML = wordsSpan(draftText);
      setTimeout(() => {
        el.querySelectorAll(".word").forEach((w, i) => {
          setTimeout(() => w.classList.add("is-struck"), i * 70);
        });
        setTimeout(() => {
          el.innerHTML = wordsSpan(finalText);
          el.querySelectorAll(".word").forEach((w, i) => {
            w.classList.add("is-new");
            w.style.animationDelay = (i * 0.05) + "s";
          });
        }, draftText.split(" ").length * 70 + 450);
      }, delay);
    }
    runEdit(line1, draft1, final1, 300);
    runEdit(line2, draft2, final2, 1500);
  }

  /* =========================================================
     Animated stat counters
     ========================================================= */
  const statEls = document.querySelectorAll(".stat__num[data-count]");
  function animateCount(el){
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    if (prefersReduced) { el.textContent = target + suffix; return; }
    const dur = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCount(entry.target); statIo.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statIo.observe(el));

  /* =========================================================
     Button ripple / glow position
     ========================================================= */
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("pointerdown", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--rx", ((e.clientX - r.left) / r.width * 100) + "%");
      btn.style.setProperty("--ry", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });

  /* Gentle pointer tilt adds depth without changing the layout. */
  function enableCardTilt(){
    if (prefersReduced || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".service-card, .portfolio-card, .testimonial-card, .featured__card").forEach(card => {
      if (card.dataset.tiltReady) return;
      card.dataset.tiltReady = "true";
      card.addEventListener("pointermove", e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 5;
        const rotateX = (0.5 - y) * 5;
        card.style.setProperty("--card-x", `${x * 100}%`);
        card.style.setProperty("--card-y", `${y * 100}%`);
        card.style.transform = `perspective(900px) translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* =========================================================
     Content data
     ========================================================= */
  const SERVICES = [
    { icon: "📦", title: "Product Descriptions", desc: "Clear, benefit-led copy that helps shoppers decide fast — built for e-commerce and marketplace listings.", benefits: "Higher conversion, less return-driving confusion", clients: "D2C brands, marketplace sellers" },
    { icon: "📝", title: "Blog Writing", desc: "Well-researched articles that answer real reader questions and support SEO without keyword-stuffing.", benefits: "Organic traffic, topical authority", clients: "SaaS, agencies, niche publishers" },
    { icon: "🌐", title: "Website Copy", desc: "Homepage and inner-page copy that explains what you do in plain language, fast.", benefits: "Lower bounce, clearer positioning", clients: "Startups, service businesses" },
    { icon: "🚀", title: "Landing Pages", desc: "Single-goal pages built around one offer, one action, and a clear reason to act now.", benefits: "Higher conversion rate", clients: "Product launches, ad campaigns" },
    { icon: "👋", title: "About Us Pages", desc: "Origin story and mission copy that builds trust without sounding like a press release.", benefits: "Stronger brand connection", clients: "Founders, small businesses" },
    { icon: "🏢", title: "Business Profiles", desc: "Concise, credible company descriptions for directories, pitch decks, and partner pages.", benefits: "Consistent brand story everywhere", clients: "B2B firms, agencies" },
    { icon: "📱", title: "Social Media Content", desc: "Platform-native captions and post copy that sound human, not templated.", benefits: "Better engagement, consistent voice", clients: "Small brands, personal brands" },
    { icon: "🎬", title: "YouTube Scripts", desc: "Hook-first scripts structured for retention, with clear visual and pacing notes.", benefits: "Stronger watch time", clients: "Educational and tech channels" },
  ];

  const PORTFOLIO = [
  {
    cat: "E-Commerce Copywriting",
    title: "Premium Product Description for a Smart Desk Lamp",
    teaser: "Benefit-driven product copy crafted to build trust, highlight key features, and increase purchase confidence.",
    body: `<strong>Premium Product Description for a Smart Desk Lamp</strong>

A desk lamp should do more than simply brighten your workspace. It should help you stay focused, reduce eye strain, and blend naturally into your environment. This smart LED desk lamp was designed with exactly that purpose in mind.

Featuring adjustable brightness levels and three color temperature modes, it adapts effortlessly to every task. Switch to cool white light for productive work sessions, warm light for relaxed evening reading, or balanced daylight mode for everyday use. The touch-sensitive controls provide smooth, responsive adjustments without the clutter of traditional buttons.

Its minimalist aluminum body complements both modern home offices and professional workspaces while occupying very little desk space. The flexible arm offers precise positioning, ensuring light reaches exactly where you need it without unwanted glare or harsh shadows.

Engineered with energy-efficient LED technology, the lamp delivers consistent illumination while consuming significantly less power than conventional lighting solutions. With an estimated lifespan of over 25,000 hours, it offers years of reliable performance with virtually no maintenance.

Whether you're working late, studying for exams, reading your favorite book, or attending virtual meetings, this smart desk lamp combines elegant design with practical functionality to create a workspace that's both comfortable and productive.

<strong>Key Benefits</strong>

• Adjustable brightness and three lighting modes
• Touch-sensitive controls for effortless operation
• Eye-friendly illumination with reduced glare
• Energy-efficient LED technology
• Durable premium aluminum construction
• Compact, modern design suitable for any workspace

Built for professionals, students, and creators alike, this lamp delivers dependable performance while enhancing the overall look and feel of your desk.`
  },
  {
    cat: "SEO Blog Writing",
    title: "Why Most Landing Pages Lose Customers in Seconds",
    teaser: "An SEO-optimized educational article designed to attract organic traffic while demonstrating persuasive long-form writing.",
    body: `<strong>Why Most Landing Pages Lose Customers in Seconds</strong>

Every visitor who lands on your website asks the same question within a few seconds:

<strong>"Is this what I'm looking for?"</strong>

If your page doesn't answer that question immediately, you've already lost the opportunity. Most landing pages don't fail because the product is weak. They fail because the message isn't clear.

A common mistake is writing headlines that describe the company instead of explaining the customer's benefit. Phrases like <em>"Revolutionizing Digital Experiences"</em> or <em>"Innovative Business Solutions"</em> sound impressive, but they don't tell visitors why they should care.

High-converting landing pages focus on outcomes rather than features. Instead of explaining what a business does, they explain how a customer's problem will be solved.

For example:

❌ "AI-Powered Workflow Management"

✅ "Finish Your Daily Tasks in Half the Time with AI Automation."

The second version immediately communicates a clear benefit that visitors can understand.

Another overlooked factor is information overload. Many pages attempt to explain every feature before establishing trust. Visitors aren't searching for every detail at first. They want confidence that they're in the right place.

Strong landing pages follow a simple structure:

• A headline focused on the customer's desired outcome.
• A supporting paragraph that explains how that outcome is achieved.
• Key benefits presented in a clear, scannable format.
• Social proof that builds credibility.
• One primary call-to-action without unnecessary distractions.

Clarity always outperforms cleverness. Visitors shouldn't have to decode your message or guess what your business offers.

The best landing pages don't convince people with flashy language. They remove uncertainty, answer questions before they're asked, and guide visitors toward a single action with confidence.

When every sentence has a purpose, conversions become the natural result—not the lucky outcome.`
  },
  {
    cat: "Website Copywriting",
    title: "Homepage Copy for a Modern SaaS Platform",
    teaser: "Clear, customer-focused homepage messaging that communicates value, builds credibility, and drives sign-ups.",
    body: `<strong>Homepage Copy for a Modern SaaS Platform</strong>

<strong>Headline</strong>

Run your business, not your admin.

<strong>Subheadline</strong>

Manage projects, invoices, clients, and team communication from one intuitive platform designed to save time and keep your business moving forward.

<strong>Why Choose Our Platform?</strong>

Growing businesses shouldn't have to juggle multiple tools just to stay organized. Our platform brings everything together in one secure workspace, helping your team collaborate more efficiently while reducing repetitive manual work.

Whether you're managing five clients or five hundred, every feature is built around one goal: helping your business operate faster with less effort.

<strong>What You Can Do</strong>

• Organize projects with real-time collaboration.
• Track invoices and payments in one dashboard.
• Manage client communication without switching platforms.
• Generate reports that help you make smarter business decisions.
• Keep your entire team connected from anywhere.

<strong>Built for Growing Businesses</strong>

From freelancers and agencies to startups and established companies, the platform scales alongside your business. No complicated setup, no unnecessary features, and no steep learning curve.

Instead of spending hours managing software, you can spend more time serving clients, closing deals, and growing your business.

<strong>Call to Action</strong>

Start your free trial today and discover how simple business management can be.

No credit card required. Cancel anytime.`
  },
  {
    cat: "Brand Story",
    title: "Brand Story for a Specialty Coffee Company",
    teaser: "Authentic storytelling that creates emotional connection, strengthens brand identity, and builds customer trust.",
    body: `<strong>Brand Story for a Specialty Coffee Company</strong>

Great coffee begins long before it reaches your cup. It starts with the people who grow it, the care they invest in every harvest, and the belief that quality should never come at the expense of honesty.

Our journey began with a simple question:

<strong>Why should exceptional coffee be difficult to trust?</strong>

Too many brands rely on polished marketing while revealing very little about where their coffee comes from or how it's produced. We wanted to build something different. Every decision we make is guided by transparency, consistency, and respect for the farmers who make our work possible.

We partner with growers who share our commitment to sustainable farming and responsible sourcing. Every batch is carefully selected, roasted in small quantities, and tested for quality before it reaches our customers. This approach allows us to preserve the unique character of every bean while ensuring a consistently exceptional cup.

For us, coffee isn't simply another product on a shelf. It's part of someone's morning routine, an afternoon conversation, or a late-night work session. Those everyday moments deserve something crafted with genuine care.

We believe great brands earn trust through actions rather than promises. That's why we're committed to clear sourcing, honest communication, and uncompromising quality in everything we do.

Every cup reflects the same values that shaped our company from the beginning: authenticity, craftsmanship, and respect for the people behind every harvest.

<strong>Our Promise</strong>

• Ethically sourced coffee from trusted farming partners.
• Small-batch roasting for maximum freshness.
• Complete transparency from origin to cup.
• Consistent quality without unnecessary complexity.

Because great coffee isn't defined by marketing.

It's defined by the experience people remember after the last sip.`
  },
  {
    cat: "Menu Copywriting",
    title: "Restaurant Menu Designed to Increase Orders",
    teaser: "Descriptive menu copy that makes every dish memorable while encouraging higher-value customer purchases.",
    body: `<strong>Restaurant Menu Designed to Increase Orders</strong>

Every memorable dining experience begins before the first bite. The right menu doesn't simply list ingredients. It creates anticipation, highlights craftsmanship, and helps guests feel confident about every choice they make.

Our menu is carefully written to celebrate fresh ingredients, balanced flavors, and the experience behind each dish. Every description is designed to be informative without overwhelming the reader, allowing the food to remain the true focus.

<strong>Signature Dishes</strong>

<strong>Wood-Fired Herb Chicken</strong>

Free-range chicken marinated for 24 hours in fresh herbs, garlic, and citrus, then slow-roasted over natural oak fire. Served with roasted seasonal vegetables and a light herb butter that enhances every bite.

<strong>Grilled Atlantic Salmon</strong>

Fresh Atlantic salmon grilled until perfectly tender and paired with creamy lemon risotto, asparagus, and a delicate white wine butter sauce that complements without overpowering the fish.

<strong>Truffle Mushroom Pasta</strong>

Fresh fettuccine tossed with sautéed wild mushrooms, roasted garlic, Parmesan cheese, and a touch of black truffle oil. Rich, comforting, and perfectly balanced.

<strong>Classic Ribeye Steak</strong>

A premium 12-ounce ribeye grilled to your preferred temperature and finished with garlic herb butter. Served alongside crispy rosemary potatoes and seasonal vegetables.

<strong>Desserts</strong>

Complete your meal with our signature Chocolate Lava Cake, served warm with handcrafted vanilla bean ice cream and fresh berries.

<strong>Our Philosophy</strong>

Every ingredient is selected for freshness. Every dish is prepared to order. Every plate is served with the belief that exceptional food deserves thoughtful presentation and honest craftsmanship.

Great dining isn't created by recipes alone.

It's created by memorable experiences shared around the table.`
  },
  {
    cat: "YouTube Scriptwriting",
    title: "Educational Script for a Technology Channel",
    teaser: "A retention-focused YouTube script featuring a compelling hook, structured storytelling, and engaging explanations.",
    body: `<strong>Educational Script for a Technology Channel</strong>

<strong>[HOOK | 0:00 - 0:15]</strong>

NARRATOR:

"What if I told you your Wi-Fi isn't actually slow? The real problem might be happening before your internet connection even reaches your device."

[Visual: A laptop loading slowly while multiple phones, TVs, and smart devices connect to the same router.]

<strong>[INTRO | 0:15 - 0:40]</strong>

Every evening, millions of people experience slower internet speeds. Most blame their internet provider. Others restart the router and hope for the best.

But in many cases, neither is the real cause.

The biggest culprit is network congestion inside your own home.

Let's see why.

<strong>[EXPLANATION | 0:40 - 2:00]</strong>

Think of your Wi-Fi like a conversation in a crowded room.

One person can speak clearly.

Ten people speaking at the same time create confusion.

Your router works in exactly the same way.

Every phone, laptop, smart TV, gaming console, security camera, and smart speaker competes for the same wireless airtime.

Even devices sitting idle still communicate with your router in the background.

The more connected devices you have, the less time each one gets to transmit data.

That's why your connection feels slower during the evening when everyone in your home is streaming, gaming, or attending video meetings.

<strong>[VISUAL DEMONSTRATION]</strong>

Show an animation comparing:

• One device connected to a router.
• Five devices sharing bandwidth.
• Fifteen devices competing for wireless airtime.

Display how available bandwidth is divided between devices.

<strong>[PRACTICAL SOLUTIONS | 2:00 - 3:00]</strong>

Here are three simple ways to improve your Wi-Fi performance:

• Move your router to an open, central location.
• Connect high-bandwidth devices to the 5 GHz network whenever possible.
• Restart your router regularly to clear temporary network issues.

If your router is more than five years old, upgrading to a modern Wi-Fi 6 router can significantly improve speed and stability.

<strong>[OUTRO | 3:00 - 3:20]</strong>

Understanding how Wi-Fi actually works helps you solve problems instead of guessing.

Technology isn't magic.

Once you know what's happening behind the scenes, fixing it becomes much easier.

If you enjoyed this explanation, subscribe for more practical technology guides that make complex topics simple.`
  },
  {
    cat: "Business Copywriting",
    title: "Professional Company Profile for a Creative Agency",
    teaser: "A concise yet persuasive company profile that reinforces credibility across websites, proposals, and marketing materials.",
    body: `<strong>Professional Company Profile for a Creative Agency</strong>

Great businesses are remembered for more than the services they provide. They're remembered for the problems they solve, the relationships they build, and the results they consistently deliver.

Founded with a commitment to thoughtful design and strategic communication, our agency helps ambitious businesses transform ideas into compelling digital experiences. We combine creativity, technology, and clear messaging to build brands that stand out in competitive markets.

From startups launching their first product to established companies refreshing their identity, every project begins with understanding the client's goals before creating solutions tailored to their audience.

Our multidisciplinary team specializes in website design, brand identity, UI/UX design, copywriting, and digital strategy. Rather than following trends, we focus on creating timeless, functional experiences that support long-term business growth.

Every project follows a structured process:

• Discovery and research
• Strategy and planning
• Creative design
• Content development
• Review and refinement
• Launch and ongoing support

This collaborative approach ensures every decision is backed by purpose, not assumptions.

Over the years, we've partnered with businesses across technology, education, healthcare, e-commerce, and professional services, helping them strengthen their online presence and communicate with greater clarity.

<strong>Why Clients Choose Us</strong>

• Strategic thinking backed by research.
• Clear communication throughout every project.
• Reliable delivery without compromising quality.
• Solutions tailored to business goals—not templates.

We believe successful partnerships are built on trust, transparency, and measurable results. Every project is an opportunity to create work that not only looks exceptional but also delivers lasting value for our clients.

Because great brands aren't built overnight.

They're built through consistent strategy, thoughtful execution, and meaningful collaboration.`
  },
  {
    cat: "Landing Page Copywriting",
    title: "Conversion-Focused Landing Page for a Productivity App",
    teaser: "Strategic landing page copy built around one offer, one audience, and one clear conversion goal.",
    body: `<strong>Conversion-Focused Landing Page for a Productivity App</strong>

<strong>Headline</strong>

Focus on what matters. Leave distractions behind.

<strong>Subheadline</strong>

Boost your productivity with an intelligent focus app that blocks distractions, organizes your workflow, and helps you accomplish more in less time.

<strong>Why Professionals Choose FocusFlow</strong>

Staying productive has never been more challenging. Endless notifications, social media, emails, and constant interruptions make deep work almost impossible.

FocusFlow is designed to solve that problem.

With one click, it creates a distraction-free environment so you can concentrate on your most important tasks without unnecessary interruptions.

Whether you're studying for exams, writing reports, coding your next project, or managing a busy workload, FocusFlow helps you stay focused from start to finish.

<strong>Key Features</strong>

• Block distracting websites and applications instantly.
• Smart Focus Timer based on proven productivity techniques.
• Daily productivity reports and progress tracking.
• Custom focus sessions tailored to your workflow.
• Automatic break reminders to prevent burnout.
• Secure cloud synchronization across all your devices.

<strong>Designed for Modern Professionals</strong>

Freelancers, students, entrepreneurs, developers, designers, and remote teams all face the same challenge: protecting their attention.

FocusFlow provides the structure you need without adding unnecessary complexity.

Simple to set up.

Powerful enough to become part of your daily routine.

<strong>What You'll Gain</strong>

• Complete more meaningful work every day.
• Reduce digital distractions.
• Improve concentration during deep work sessions.
• Build healthier productivity habits.
• Stay organized without feeling overwhelmed.

<strong>Call to Action</strong>

Start your free 14-day trial today.

No credit card required. No hidden fees. Cancel anytime.

Take control of your attention—and let your best work speak for itself.`
  }
];
  const FAQS = [
    { q: "Why AI-assisted writing?", a: "AI is excellent at producing a fast first draft and exploring structure — but it also confidently states things that aren't true and tends toward generic phrasing. Using it for speed, then rewriting, fact-checking, and voicing every piece by hand, gets the turnaround benefit without the accuracy or authenticity risk." },
    { q: "How long does delivery take?", a: "Most single pieces (a product description, a landing page section) are delivered within 24–72 hours depending on research depth required. Larger projects — a full site's copy, a multi-part blog series — are scoped with a timeline upfront before work begins." },
    { q: "Can you write in different tones?", a: "Yes. Tone is set by the brand and audience, not by default habit — playful and irreverent for a DTC brand, precise and restrained for a fintech product, warm and plain for a healthcare service. A short brief or existing brand voice guide speeds this up considerably." },
    { q: "What industries do you write for?", a: "Most experience so far is in tech, SaaS, e-commerce, and education — the samples above reflect that. I'm glad to take on other industries with extra research time built into the timeline and cost." },
    { q: "Do you disclose when content is AI-assisted?", a: "Always, if asked, and it's stated plainly on this page. The AI-assisted step is treated as a tool in the process, not something to hide — the human editing and fact-checking step is what's actually being sold." },
  ];

  /* ---- render services ---- */
  const servicesGrid = document.getElementById("servicesGrid");
  servicesGrid.innerHTML = SERVICES.map(s => `
    <div class="service-card" data-reveal>
      <div class="service-card__icon" aria-hidden="true">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <p class="service-card__meta"><strong>Benefits:</strong> ${s.benefits}</p>
      <p class="service-card__meta"><strong>Ideal for:</strong> ${s.clients}</p>
    </div>
  `).join("");
  servicesGrid.querySelectorAll(".service-card").forEach(card => card.classList.add("is-visible"));
  enableCardTilt();

  /* ---- render portfolio + filters ---- */
  const portfolioGrid = document.getElementById("portfolioGrid");
  const filtersBar = document.getElementById("filters");
  const categories = [...new Set(PORTFOLIO.map(p => p.cat))];

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter";
    btn.dataset.filter = cat;
    btn.textContent = cat;
    filtersBar.appendChild(btn);
  });

  function renderPortfolio(filter){
    const items = filter === "all" ? PORTFOLIO : PORTFOLIO.filter(p => p.cat === filter);
    portfolioGrid.innerHTML = items.map((p, i) => `
      <button class="portfolio-card" data-index="${PORTFOLIO.indexOf(p)}" data-reveal>
        <span class="portfolio-card__check">✓</span>
        <p class="portfolio-card__cat">${p.cat}</p>
        <h3>${p.title}</h3>
        <p>${p.teaser}</p>
       <span class="badge">Case Study</span>
      </button>
    `).join("");

    portfolioGrid.querySelectorAll(".portfolio-card").forEach(card => {
      card.classList.add("is-visible"); // already in view context, skip re-observing
      card.addEventListener("click", () => openModal(PORTFOLIO[card.dataset.index]));
    });
    enableCardTilt();
  }
  renderPortfolio("all");

  filtersBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    filtersBar.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    renderPortfolio(btn.dataset.filter);
  });

  /* ---- modal ---- */
  const modal = document.getElementById("portfolioModal");
  const modalCategory = document.getElementById("modalCategory");
  const modalTitle = document.getElementById("modalTitle");
  const modalBadge = document.getElementById("modalBadge");
  const modalBody = document.getElementById("modalBody");

  function openModal(item){
    modalCategory.textContent = item.cat;
    modalTitle.textContent = item.title;
    modalBadge.textContent = item.badgeLabel || "Sample Project";
    modalBadge.className = "badge" + (item.badgeLabel ? " badge--real" : "");
    modalBody.innerHTML = item.body.replace(/\n/g, "<br>");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__close").focus();
  }
  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---- featured project ---- */
  const FEATURED = {
    cat: "YouTube Technology Script",
    title: "Fast Charging EXPLAINED: Does It Really Damage Your Phone Battery?",
    badgeLabel: "Real Client Project",
    body: `<strong>Opening Hook (0:00–0:20)</strong>\nImagine buying a brand-new smartphone today... and two years later, the battery barely lasts half a day.\n\nMost people immediately blame one thing: fast charging.\n\nBut is fast charging actually destroying your battery, or is that one of the biggest misconceptions in modern technology? Let's separate facts from myths.\n\n<strong>Introduction (0:20–0:45)</strong>\nWelcome back! If you enjoy technology explained in a simple, practical, and evidence-based way, you're in the right place.\n\nToday we're uncovering how fast charging actually works, what really causes battery degradation, and the simple habits that can help your phone stay healthy for years. Let's get started.\n\n<strong>Section 1 — Understanding Fast Charging (0:45–1:50)</strong>\nFast charging isn't simply "forcing" electricity into your phone. Modern smartphones contain sophisticated power management systems that continuously communicate with the charger.\n\nThe phone decides exactly how much power it can safely receive based on battery temperature, voltage, charging protocol, and current battery level. When the battery is nearly empty, the device accepts higher power to recharge quickly. As it approaches roughly 70–80%, charging speed gradually tapers off — a process called charge tapering that reduces stress on the battery and improves long-term reliability.\n\n<strong>Section 2 — What Actually Damages a Battery? (1:50–3:10)</strong>\nIf fast charging isn't the main problem, what is? The biggest enemy of every lithium-ion battery is heat. Excessive temperatures accelerate the chemical aging process inside the battery, permanently reducing its capacity over time.\n\nThis is why gaming while charging, leaving a phone in a hot car, using poor-quality chargers, or blocking airflow around the device can often cause more long-term damage than fast charging itself. Heat, not charging speed alone, is what deserves your attention.\n\n<strong>Section 3 — Charging Habits That Matter (3:10–4:20)</strong>\nBattery health is shaped by daily habits. Four practices recommended by manufacturers and battery experts: use certified or original chargers; avoid excessive heat while charging; keep Optimized Charging or Battery Protection enabled if your device offers it; and for everyday use, keeping the battery roughly between 20–80% can reduce long-term wear — though charging fully is perfectly fine when you need the extra battery life.\n\nSmall habits may seem insignificant today, but over hundreds of charging cycles, they add up.\n\n<strong>Closing (4:20–5:00)</strong>\nSo, does fast charging ruin your battery? Not by itself. Modern smartphones are engineered with layers of hardware and software protection to charge safely and efficiently. What truly affects battery lifespan is excessive heat, poor charging habits, and natural chemical aging over time.\n\nUnderstanding how your device actually works helps you make better decisions than believing common internet myths.`
  };
  const readScriptBtn = document.getElementById("readScriptBtn");
  if (readScriptBtn) {
    readScriptBtn.addEventListener("click", () => openModal(FEATURED));
  }

  /* ---- render FAQ ---- */
  const accordion = document.getElementById("accordion");
  accordion.innerHTML = FAQS.map((f, i) => `
    <div class="accordion-item" data-reveal>
      <button class="accordion-item__q" aria-expanded="false" aria-controls="faq-a-${i}">
        <span>${f.q}</span>
        <span class="plus" aria-hidden="true">+</span>
      </button>
      <div class="accordion-item__a" id="faq-a-${i}">
        <div class="accordion-item__a-inner">${f.a}</div>
      </div>
    </div>
  `).join("");

  accordion.querySelectorAll(".accordion-item").forEach(item => {
    item.classList.add("is-visible");
    const q = item.querySelector(".accordion-item__q");
    const a = item.querySelector(".accordion-item__a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      accordion.querySelectorAll(".accordion-item").forEach(other => {
        other.classList.remove("is-open");
        other.querySelector(".accordion-item__q").setAttribute("aria-expanded", "false");
        other.querySelector(".accordion-item__a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        q.setAttribute("aria-expanded", "true");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* =========================================================
     Contact form — sends real submissions via Formspree.
     SETUP (one-time, ~2 minutes):
       1. Go to https://formspree.io and sign up free.
       2. Create a new form — it gives you an endpoint like
          https://formspree.io/f/abcdwxyz
       3. Paste that endpoint below, replacing FORM_ENDPOINT.
       4. Submit the form once yourself and confirm your form
          in the email Formspree sends — required before it
          will deliver messages to your inbox.
     Until FORM_ENDPOINT is set, the form falls back to opening
     a pre-filled email in the visitor's own email app instead.
     ========================================================= */
  const FORM_ENDPOINT = ""; // <-- paste your Formspree endpoint URL here
  const FALLBACK_EMAIL = "anasjahangirking@gmail.com";

  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const submitBtn = form.querySelector("button[type=submit]");
  const submitLabel = submitBtn.querySelector(".btn__label");

  function setError(id, msg){ document.getElementById("err-" + id).textContent = msg || ""; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value;
    const message = form.message.value.trim();

    if (name.length < 2) { setError("name", "Please enter your name."); valid = false; } else setError("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("email", "Please enter a valid email."); valid = false; } else setError("email");
    if (message.length < 10) { setError("message", "Please add a few more details."); valid = false; } else setError("message");

    if (!valid) { formNote.textContent = ""; return; }

    if (!FORM_ENDPOINT) {
      const mailBody = `From: ${name} (${email})\nProject type: ${subject}\n\n${message}`;
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent("New inquiry: " + subject)}&body=${encodeURIComponent(mailBody)}`;
      formNote.textContent = "Opening your email app to send this — once you set up Formspree, it'll send instantly instead.";
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = "Sending…";
    formNote.textContent = "";

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        formNote.textContent = "Thanks — your message is in. I'll reply within a day or two.";
        form.reset();
      } else {
        formNote.textContent = "Something went wrong sending that. Try WhatsApp or email instead.";
      }
    } catch (err) {
      formNote.textContent = "Couldn't reach the server. Try WhatsApp or email instead.";
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Send Message";
    }
  });

  /* newly-rendered reveal elements (services/portfolio/faq) need immediate visibility
     since they're injected after the initial observer pass in some layouts */
  document.querySelectorAll("[data-reveal]").forEach(el => {
    if (!el.classList.contains("is-visible")) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add("is-visible");
    }
  });
  enableCardTilt();

})();
