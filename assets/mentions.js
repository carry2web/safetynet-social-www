// Replace all @mentions in a DOM element with profile links and avatars
function renderMentions(el) {
  if (!el || !el.innerHTML) return;
  // Replace @username with profile link+avatar, but avoid inside HTML tags
  el.innerHTML = el.innerHTML.replace(/(^|\s)@(\w{3,32})\b/g, (m, pre, username) => {
    return pre + renderMention('@' + username);
  });
}

window.renderMentions = renderMentions;
// assets/mentions.js
// Utility to render @mentions as profile links with avatars for SafetyNet Social

// Generic on-chain @mention rendering for DeSo
const PROFILE_CACHE = {};

async function fetchProfile(username) {
  username = username.toLowerCase();
  if (PROFILE_CACHE[username]) return PROFILE_CACHE[username];
  try {
    const res = await fetch('https://node.deso.org/api/v0/get-single-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Username: username })
    });
    const data = await res.json();
    if (data && data.Profile && data.Profile.PublicKeyBase58Check) {
      PROFILE_CACHE[username] = {
        pubkey: data.Profile.PublicKeyBase58Check,
        avatar: data.Profile.ProfilePic || 'https://safetynet.social/assets/img/default-profile-pic.png',
        url: `https://safetynet.social/u/${username}`
      };
      return PROFILE_CACHE[username];
    }
  } catch (e) {}
  PROFILE_CACHE[username] = {
    pubkey: '',
    avatar: 'https://safetynet.social/assets/img/default-profile-pic.png',
    url: `https://safetynet.social/u/${username}`
  };
  return PROFILE_CACHE[username];
}

async function renderMention(str) {
  if (!str || typeof str !== 'string' || !str.startsWith('@')) return str;
  const username = str.slice(1);
  const profile = await fetchProfile(username);
  return `
    <span class="mention">
      <img src="${profile.avatar}" alt="Profile picture of @${username}" class="mention-avatar" width="24" height="24" loading="lazy">
      <a href="${profile.url}" target="_blank" rel="noopener"><strong>@${username}</strong></a>
    </span>
  `;
}

// Replace all @mentions in a DOM element with profile links and avatars (async)
async function renderMentions(el) {
  if (!el || !el.innerHTML) return;
  // Find all @mentions
  const matches = [...el.innerHTML.matchAll(/(^|\s)@(\w{3,32})\b/g)];
  if (!matches.length) return;
  let html = el.innerHTML;
  for (const match of matches) {
    const full = match[0];
    const username = match[2];
    const mentionHtml = await renderMention('@' + username);
    html = html.replace(full, match[1] + mentionHtml);
  }
  el.innerHTML = html;
}

window.renderMention = renderMention;
window.renderMentions = renderMentions;
