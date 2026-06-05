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

export const CATEGORIES = [
  {
    id: 'animal-health',
    name: 'Animal Health',
    slug: 'animal-health',
    description: 'General animal health topics and disease management',
    icon: '🏥',
  },
  {
    id: 'livestock-production',
    name: 'Livestock Production',
    slug: 'livestock-production',
    description: 'Modern livestock farming and production techniques',
    icon: '🐄',
  },
  {
    id: 'poultry-farming',
    name: 'Poultry Farming',
    slug: 'poultry-farming',
    description: 'Chicken, duck, and other poultry management',
    icon: '🐔',
  },
  {
    id: 'dairy-farming',
    name: 'Dairy Farming',
    slug: 'dairy-farming',
    description: 'Dairy cattle management and milk production',
    icon: '🥛',
  },
  {
    id: 'beef-cattle',
    name: 'Beef Cattle Management',
    slug: 'beef-cattle',
    description: 'Beef cattle breeding and fattening',
    icon: '🐂',
  },
  {
    id: 'goat-production',
    name: 'Goat Production',
    slug: 'goat-production',
    description: 'Goat farming and herd management',
    icon: '🐐',
  },
  {
    id: 'sheep-production',
    name: 'Sheep Production',
    slug: 'sheep-production',
    description: 'Sheep farming and wool production',
    icon: '🐑',
  },
  {
    id: 'pig-farming',
    name: 'Pig Farming',
    slug: 'pig-farming',
    description: 'Pig rearing and swine production',
    icon: '🐷',
  },
  {
    id: 'aquaculture',
    name: 'Aquaculture',
    slug: 'aquaculture',
    description: 'Fish and aquatic animal farming',
    icon: '🐟',
  },
  {
    id: 'veterinary-medicine',
    name: 'Veterinary Medicine',
    slug: 'veterinary-medicine',
    description: 'Veterinary science and clinical practice',
    icon: '💉',
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    slug: 'pet-care',
    description: 'Dogs, cats, and companion animal care',
    icon: '🐕',
  },
  {
    id: 'wildlife-health',
    name: 'Wildlife Health',
    slug: 'wildlife-health',
    description: 'Wildlife conservation and health management',
    icon: '🦁',
  },
];

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
  'livestock-production',
  'poultry-farming',
  'dairy-farming',
  'pet-care',
];

export const NAVIGATION = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Categories', href: '/categories' },
  { label: 'Products', href: '/products' },
  { label: 'Resources', href: '/resources' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  About: [
    { label: 'About Us', href: '/about' },
    { label: 'Team', href: '/team' },
    { label: 'Mission & Vision', href: '/mission' },
  ],
  Resources: [
    { label: 'Articles', href: '/articles' },
    { label: 'Categories', href: '/categories' },
    { label: 'Resources', href: '/resources' },
    { label: 'Downloads', href: '/downloads' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
  Connect: [
    { label: 'Contact', href: '/contact' },
    { label: 'Newsletter', href: '/newsletter' },
    { label: 'Community', href: '/community' },
  ],
};
