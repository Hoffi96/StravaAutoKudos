// ==UserScript==
// @name         Strava Kudos All ohne eigene / max 50 / ID-Check
// @version      1.3
// @match        https://www.strava.com/dashboard*
// @run-at       document-idle
// @inject-into  auto
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'strava-kudos-all-skip-own-limit';
  const MAX_KUDOS = 50;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function getMyAthleteId() {
    const links = Array.from(document.querySelectorAll("a[href*='/athletes/']"));
    for (const link of links) {
      const m = link.href.match(/\/athletes\/(\d+)/);
      if (m && (
        link.closest('[data-testid*="user"], [data-testid*="avatar"], nav, header, [class*="user"], [class*="avatar"]')
      )) {
        return m[1];
      }
    }
    return null;
  }

  function getFeedCards() {
    return Array.from(document.querySelectorAll("div[data-testid='web-feed-entry'], article, .feed-entry"));
  }

  function getCardAthleteId(card) {
    const athleteLink = card.querySelector("a[href*='/athletes/']");
    if (!athleteLink) return null;
    const m = athleteLink.href.match(/\/athletes\/(\d+)/);
    return m ? m[1] : null;
  }

  function isOwnActivity(card, myAthleteId) {
    const cardAthleteId = getCardAthleteId(card);
    return !!myAthleteId && !!cardAthleteId && cardAthleteId === myAthleteId;
  }

  function getUnkudoedButton(card) {
    const buttons = Array.from(card.querySelectorAll("button[data-testid='kudos_button']"));
    return buttons.find(btn => {
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

      const btn = getUnkudoedButton(card);
      if (!btn) {
        skippedNoButton++;
        continue;
      }

      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(700);

      if (clicked >= MAX_KUDOS) break;

      btn.click();
      clicked++;
      console.log(`Kudos ${clicked}/${MAX_KUDOS}`);
      await sleep(900);
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
