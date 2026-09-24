const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// Add necessary imports
content = content.replace(
  /import React, \{ useState, useEffect \} from 'react';/,
  `import React, { useState, useEffect, useRef } from 'react';\nimport { useParams, useNavigate } from 'react-router-dom';\nimport axios from 'axios';`
);

// Add data fetching
const setupCode = `
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const res = await axios.get(\`\${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/landing-pages/\${slug}\`);
        setPageData(res.data);
      } catch (err) {
        console.error(err);
        navigate('/'); // Redirect if not found
      } finally {
        setLoading(false);
      }
    };
    if(slug) fetchLandingPage();
    else setLoading(false);
  }, [slug, navigate]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;
  if (!pageData && slug) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Page Not Found</div>;

  // Use pageData if available, fallback to default hardcoded arrays
  const heroImages = pageData?.heroSlides?.map(s => s.imageUrl) || [
    '/images/1.jpg',
    '/images/2.jpg',
    '/images/3.jpg'
  ];
`;

content = content.replace(
  /const ReferenceLandingPage = \(\) => \{\n  const \[isModalOpen, setIsModalOpen\] = useState\(false\);\n  const \[showFloatingUI, setShowFloatingUI\] = useState\(false\);/,
  `const ReferenceLandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFloatingUI, setShowFloatingUI] = useState(false);
${setupCode}`
);

// Map global hero text
content = content.replace(
  /Imazen Studios/g,
  `{pageData?.heroSubheading || 'Studio'}`
);

content = content.replace(
  /Beautiful Baby<br\/>Photography/g,
  `{pageData?.heroHeading || 'Beautiful Baby\\nPhotography'}` // Will need dangerouslySetInnerHTML or just keep it simple, actually let's use CSS white-space pre-line.
);

content = content.replace(
  /"Your Baby's Smile, Captured Forever as Art."/g,
  `{pageData?.heroQuote || '"Your Baby\\'s Smile, Captured Forever as Art."'}`
);

content = content.replace(
  /Professional baby shoots with stunning themes and complete safety./g,
  `{pageData?.heroDescription || 'Professional baby shoots with stunning themes and complete safety.'}`
);

content = content.replace(
  /Packages Start From Just/g,
  `{pageData?.heroPriceText || 'Packages Start From Just'}`
);

content = content.replace(
  /₹3,999\/-/g,
  `{pageData?.heroPriceAmount || '₹3,999/-'}`
);

content = content.replace(
  /Book Your Shoot Now/g,
  `{pageData?.heroButtonText || 'Book Your Shoot Now'}`
);

// Replace Floating Button Texts
content = content.replace(
  /Hurry, Limited Slots Available!/g,
  `{pageData?.floatingBubbleText || 'Hurry, Limited Slots Available!'}`
);

content = content.replace(
  />\s*Book Now\s*<\/button>/g,
  `>
          {pageData?.floatingButtonText || 'Book Now'}
        </button>`
);

// Parallax Section Mapping
content = content.replace(
  /Affordable Premium Baby Shoot/g,
  `{pageData?.parallaxFooter?.heading || 'Affordable Premium Baby Shoot'}`
);

content = content.replace(
  /Starts From Just {pageData\?\.heroPriceAmount \|\| '₹3,999\/-'}/g, // It already got replaced above by ₹3,999/-
  `{pageData?.parallaxFooter?.subheading || 'Starts From Just ₹3,999/-'}`
);

content = content.replace(
  /Access to custom themes, wraps, and professional team without breaking your budget./g,
  `{pageData?.parallaxFooter?.description || 'Access to custom themes, wraps, and professional team without breaking your budget.'}`
);

content = content.replace(
  /Claim Your Spot Now/g,
  `{pageData?.parallaxFooter?.buttonText || 'Claim Your Spot Now'}`
);

// Change component name at bottom
content = content.replace(/export default ReferenceLandingPage;/g, 'export default ReferenceLandingPage;'); // Actually, let's keep it named ReferenceLandingPage in memory but export it as default, it works.

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', content, 'utf8');
console.log('Refactored LandingPage.jsx');
