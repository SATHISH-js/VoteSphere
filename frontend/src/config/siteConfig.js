/**
 * Global Site Configuration & Branding
 * Update branding settings in this single file to reflect across the entire application.
 */
export const siteConfig = {
  name: 'VoteSphere',
  shortName: 'VoteSphere',
  tagline: 'Real-Time Polling & Instant Audience Insights',
  description: 'Create engaging polls, gather authentic opinions, and watch live responses update instantly with smart fraud prevention.',
  domain: 'votesphere.app',
  
  // Theme highlights
  logo: {
    textPrefix: 'Vote',
    textHighlight: 'Sphere',
  },

  // Navigation Links
  links: {
    github: 'https://github.com',
    support: 'support@votesphere.app',
  },

  // Voter Protection Tier Labels
  voterProtectionTiers: {
    smart_fingerprint: {
      id: 'smart_fingerprint',
      label: 'Smart Anti-Fraud (No Login Needed)',
      badge: 'Open Voting',
      description: 'Anyone can vote. Duplicate votes are blocked using browser & hardware fingerprinting + IP checks.',
      icon: 'ShieldCheck',
    },
    strict_ip: {
      id: 'strict_ip',
      label: 'Strict IP Restriction',
      badge: '1 Vote Per Network',
      description: 'Limits voting to exactly one vote per IP address / Wi-Fi network. Great for classrooms & offices.',
      icon: 'Globe',
    },
    require_account: {
      id: 'require_account',
      label: 'Verified Accounts Only',
      badge: 'Login Required',
      description: 'Voters must sign in. 100% duplicate-proof for official contests, student elections, or company decisions.',
      icon: 'Lock',
    },
  },
};

export default siteConfig;
