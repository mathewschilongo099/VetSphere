export { CATEGORIES } from './categories';

export const SITE_CONFIG = {
  siteName: 'VetSphere Africa',
  siteDescription: 'Trusted veterinary knowledge for better animal health and production in Africa',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://vetsphere.africa',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://vetsphere.africa',
  socialMedia: {
    twitter: 'https://twitter.com/VetSphereAfrica',
    facebook: 'https://facebook.com/VetSphereAfrica',
    instagram: 'https://instagram.com/VetSphereAfrica',
    linkedin: 'https://linkedin.com/company/vetsphere-africa',
  },
  email: 'info@vetsphere.africa',
  phone: '+1 (123) 456-7890',
};

export const TESTIMONIALS = [
  {
    author: 'Dr. James Kipchoge',
    role: 'Veterinarian, Kenya',
    content: 'VetSphere Africa has become my go-to resource for the latest information on livestock management. The articles are well-researched and practical.',
    avatar: '/images/testimonials/avatar-1.jpg',
  },
  {
    author: 'Mrs. Jane Mwangi',
    role: 'Dairy Farmer, Uganda',
    content: 'I\'ve improved my milk production significantly by following the guidelines and tips from VetSphere. Highly recommended!',
    avatar: '/images/testimonials/avatar-2.jpg',
  },
  {
    author: 'Prof. Samuel Okonkwo',
    role: 'Animal Science Professor, Nigeria',
    content: 'The quality of content and commitment to accuracy makes VetSphere a credible source for veterinary education in Africa.',
    avatar: '/images/testimonials/avatar-3.jpg',
  },
];

export const FEATURED_CATEGORIES = [
  'animal-health',
  'cattle',
  'poultry',
  'dairy-farming',
  'pet-care',
];

export const NAVIGATION = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Categories', href: '/categories' },
  { label: 'Services', href: '/services' },
  { label: 'Ask VetAssist', href: '/ask' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  About: [
    { label: 'About Us', href: '/about' },
    { label: 'Services', href: '/services' },
  ],
  Resources: [
    { label: 'Articles', href: '/articles' },
    { label: 'Categories', href: '/categories' },
    { label: 'Quiz', href: '/quiz' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
  Connect: [
    { label: 'Contact', href: '/contact' },
  ],
};
