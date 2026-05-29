// ==UserScript==
// @name         Strava Kudos All ohne eigene / max 50 / Gruppenfix
// @version      1.4
// @match        https://www.strava.com/dashboard*
// @run-at       document-idle
// @inject-into  auto
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'strava-kudos-all-group-fix';
  const MAX_KUDOS = 50;

  function getMyAthleteId() {
    const links = Array.from(document.querySelectorAll("a[href*='/athletes/']"));
    for (const link of links) {
      const m = link.href.match(/\/athletes\/(\d+)/);
      if (m && link.closest('nav, header, [data-testid*="user"], [data-testid*="avatar"], [class*="user"], [class*="avatar"]')) {
        return m[1];
      }
    }
    return null;
  }

  function getFeedCards() {
    return Array.from(document.querySelectorAll("div[data-testid='web-feed-entry'], article, .feed-entry"));
  }

  function getCardAthleteIds(card) {
    const ids = new Set();
    const links = Array.from(card.querySelectorAll("a[href*='/athletes/']"));
    for (const link of links) {
      const m = link.href.match(/\/athletes\/(\d+)/);
      if (m) ids.add(m[1]);
    }
    return ids;
  }

  function isOwnActivity(card, myAthleteId) {
    if (!myAthleteId) return false;
    const ids = getCardAthleteIds(card);
    return ids.has(myAthleteId);
  }

  function getUnkudoedButtons(card) {
    return Array.from(card.querySelectorAll("button[data-testid='kudos_button']")).filter(btn => {
      const hasUnfilledIcon = !!btn.querySelector("svg[data-testid='unfilled_kudos']");
      const isViewAll = (btn.getAttribute('title') || '').trim() === 'View all kudos';
      return hasUnfilledIcon && !isViewAll && !btn.disabled;
    });
  }

  async function giveKudos() {
    const myAthleteId = getMyAthleteId();
    const cards = getFeedCards();

    console.log('Meine Athlete-ID:', myAthleteId);

    let clicked = 0;
    let skippedOwn = 0;
    let skippedNoButton = 0;

    for (const card of cards) {
      if (clicked >= MAX_KUDOS) break;

      if (isOwnActivity(card, myAthleteId)) {
        skippedOwn++;
        console.log('Eigene Aktivität übersprungen');
        continue;
      }

      const buttons = getUnkudoedButtons(card);

      if (!buttons.length) {
        skippedNoButton++;
        continue;
      }

      for (const btn of buttons) {
        if (clicked >= MAX_KUDOS) break;

        if (!btn.isConnected || btn.disabled) continue;

        const stillUnkudoed = !!btn.querySelector("svg[data-testid='unfilled_kudos']");
        if (!stillUnkudoed) continue;

        btn.scrollIntoView({ behavior: 'auto', block: 'center' });
        btn.click();
        clicked++;
        console.log(`Kudos ${clicked}/${MAX_KUDOS}`);
      }
    }

    alert(
      `Kudos vergeben: ${clicked}\n` +
      `Eigene Aktivitäten übersprungen: ${skippedOwn}\n` +
      `Bereits gekudoste/ungeeignete Einträge übersprungen: ${skippedNoButton}`
    );
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.textContent = 'Send Kudos';
    Object.assign(btn.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '99999',
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid rgba(0,0,0,0.15)',
      background: '#fc4c02',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer'
    });

    btn.addEventListener('click', giveKudos);
    document.body.appendChild(btn);
  }

  setTimeout(addButton, 2500);
})();
