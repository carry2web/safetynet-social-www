// assets/mentions.js
// Utility to render @mentions as profile links with avatars for SafetyNet Social

// Map of known usernames to public keys (expand as needed)
const SN_PROFILE_PUBKEYS = {
  arnoud: 'BC1YLgBND6GqfWYb8HyY3hAm2UpT8aeFv2fX41sMPAu7uuVjuSQtDju',
  stevonagy: 'BC1YLhUQS3L6kn7biWxa3LCXe1KmzGDro6TFo3Jro2Bi3n31EKZyUoJ',
  carry2web: 'BC1YLh8heSjLGcmd7k8p2L4C63r4PhGCdESTcVNDDvTbrrP8NaidpTF',
  diamondthumb: 'BC1YLiJUUwY9Q5cbT1XCSVTp53piLWM3o1uCWvU8wAvG1wUVvNbupij',
  that70srobot: 'BC1YLjVpAEXYm7W1iADM7VfGc2jRi4RyZA1Sx14zvKN6Ti7ADtEQFzL',
  elizabethtubbs: 'BC1YLi4GfkHpgdD8s9QLSy5aZNpmGVd9UJU4hpFGAnjjhpTW6N9hxX1',
  leilathigpen: 'BC1YLhxqBLVxEUFJU3QeJ13427h5CBSf3mhEeQu2ppFUGWYvnbD6Z3P',
  // Add more as needed
};

function renderMention(str) {
  // Only handle @username format
  if (!str || typeof str !== 'string' || !str.startsWith('@')) return str;
  const username = str.slice(1);
  const pubkey = SN_PROFILE_PUBKEYS[username.toLowerCase()];
  const profileUrl = `https://safetynet.social/u/${username}`;
  const avatarUrl = pubkey
    ? `https://validator.safetynet.social/api/v0/get-single-profile-picture/${pubkey}?fallback=https://safetynet.social/assets/img/default-profile-pic.png`
    : 'https://safetynet.social/assets/img/default-profile-pic.png';
  return `
    <span class="mention">
      <img src="${avatarUrl}" alt="Profile picture of @${username}" class="mention-avatar" width="24" height="24" loading="lazy">
      <a href="${profileUrl}" target="_blank" rel="noopener"><strong>@${username}</strong></a>
    </span>
  `;
}

// For use in other scripts
window.renderMention = renderMention;
