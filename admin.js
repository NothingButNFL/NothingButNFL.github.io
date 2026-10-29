const adminStorageKey = "nothingbutfootball-front-office-v1";
const adminFirstSeason = 2026;
const adminSeasons = Array.from({ length: 8 }, (_, index) => adminFirstSeason + index);
const adminCapRows = document.querySelector("#admin-cap-rows");
const adminStorageNotice = document.querySelector("#admin-storage-notice");
const adminStatus = document.querySelector("#admin-status");

function emptyAdminSeason(position = "", rosterType = "") {
  return {
    position,
    rosterType,
    baseSalary: 0,
    proratedBonus: 0,
    rosterBonus: 0,
    guaranteedSalary: 0,
    yearsRemaining: 0,
    tradePenalty: 0,
    tradeNetSavings: 0,
    releasePenalty: 0,
    releaseNetSavings: 0
  };
}

function emptyAdminData() {
  return {
    schema: "nbf-front-office",
    version: 3,
    selectedTeam: nflTeams[0].id,
    leagueCaps: Object.fromEntries(adminSeasons.map((year) => [year, null])),
    teams: Object.fromEntries(nflTeams.map(({ id }) => [id, {
      roster: [],
      seasons: Object.fromEntries(adminSeasons.map((year) => [year, { manualAdjustment: 0 }]))
    }])),
    picks: []
  };
}

function validInteger(value, min = 0, max = 999999999) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

function validAdminData(data) {
  if (!data || data.schema !== "nbf-front-office" || data.version !== 3 ||
      !data.leagueCaps || !data.teams || typeof data.teams !== "object" || !Array.isArray(data.picks) ||
      (data.selectedTeam !== undefined && !nflTeams.some(({ id }) => id === data.selectedTeam)) ||
      Object.keys(data.teams).length !== nflTeams.length || data.picks.length > 5000) return false;

  for (const year of adminSeasons) {
    const cap = data.leagueCaps[year];
    if (cap !== null && !validInteger(cap)) return false;
  }

  const playerIds = new Set();
  for (const { id } of nflTeams) {
    const team = data.teams[id];
    if (!team || !Array.isArray(team.roster) || team.roster.length > 5000 || !team.seasons) return false;
    for (const year of adminSeasons) {
      const adjustment = team.seasons[year]?.manualAdjustment;
      if (!Number.isSafeInteger(adjustment) || Math.abs(adjustment) > 999999999) return false;
    }
    for (const player of team.roster) {
      if (!player || typeof player.id !== "string" || !player.id || playerIds.has(player.id) ||
          typeof player.name !== "string" || !player.name.trim() || player.name.length > 70 || !player.seasons) return false;
      playerIds.add(player.id);
      for (const year of adminSeasons) {
        const entry = player.seasons[year];
        if (!entry || typeof entry.position !== "string" || entry.position.length > 8 ||
            typeof entry.rosterType !== "string" || entry.rosterType.length > 30 ||
            !validInteger(entry.baseSalary) || !validInteger(entry.proratedBonus) ||
            !validInteger(entry.rosterBonus) || !validInteger(entry.guaranteedSalary) ||
            !validInteger(entry.yearsRemaining, 0, 8) ||
            !validInteger(entry.tradePenalty) || !Number.isSafeInteger(entry.tradeNetSavings) ||
            Math.abs(entry.tradeNetSavings) > 999999999 || !validInteger(entry.releasePenalty) ||
            !Number.isSafeInteger(entry.releaseNetSavings) || Math.abs(entry.releaseNetSavings) > 999999999) return false;
      }
    }
  }

  const pickIds = new Set();
  const uniquePickRights = new Set();
  for (const pick of data.picks) {
    if (!pick || typeof pick.id !== "string" || !pick.id || pickIds.has(pick.id) ||
        !Number.isInteger(pick.year) || pick.year < 2000 || pick.year > 2100 ||
        !Number.isInteger(pick.round) || pick.round < 1 || pick.round > 20 ||
        !nflTeams.some(({ id }) => id === pick.originalTeam) ||
        !nflTeams.some(({ id }) => id === pick.currentOwner)) return false;
    const pickRight = `${pick.year}:${pick.round}:${pick.originalTeam}`;
    if (uniquePickRights.has(pickRight)) return false;
    pickIds.add(pick.id);
    uniquePickRights.add(pickRight);
  }
  return true;
}

function migrateAdminData(data) {
  if (data?.version === 1) {
    if (data.schema !== "nbf-front-office" || !data.teams || !Array.isArray(data.picks) ||
        Object.keys(data.teams).length !== nflTeams.length) {
      throw new Error("Saved front-office data is invalid. No changes were made.");
    }
    const migrated = emptyAdminData();
    migrated.picks = data.picks;
    const oldCaps = nflTeams.map(({ id }) => data.teams[id]?.salaryCap).filter(Number.isSafeInteger);
    const sharedCap = oldCaps.length ? Math.max(...oldCaps) : null;
    migrated.leagueCaps[adminFirstSeason] = sharedCap;
    for (const { id } of nflTeams) {
      const oldTeam = data.teams[id];
      if (!oldTeam || !Array.isArray(oldTeam.roster)) {
        throw new Error("Saved front-office data is invalid. No changes were made.");
      }
      if (Number.isSafeInteger(oldTeam.salaryCap)) {
        migrated.teams[id].seasons[adminFirstSeason].manualAdjustment = oldTeam.salaryCap - sharedCap;
      }
      migrated.teams[id].roster = oldTeam.roster.map((oldPlayer) => {
        if (!oldPlayer || typeof oldPlayer.name !== "string" || typeof oldPlayer.position !== "string" ||
            !Number.isSafeInteger(oldPlayer.capHit) || !Number.isInteger(oldPlayer.years)) {
          throw new Error("Saved front-office data is invalid. No changes were made.");
        }
        const player = {
          id: oldPlayer.id,
          name: oldPlayer.name,
          seasons: Object.fromEntries(adminSeasons.map((year) => [
            year,
            emptyAdminSeason(oldPlayer.position, "Active")
          ]))
        };
        player.seasons[adminFirstSeason].baseSalary = oldPlayer.capHit;
        player.seasons[adminFirstSeason].yearsRemaining = Math.max(0, Math.min(8, oldPlayer.years));
        return player;
      });
    }
    if (!validAdminData(migrated)) {
      throw new Error("Saved front-office data is invalid. No changes were made.");
    }
    return migrated;
  }

  if (data?.version === 2) {
    if (data.schema !== "nbf-front-office" || !data.teams || !Array.isArray(data.picks) ||
        Object.keys(data.teams).length !== nflTeams.length) {
      throw new Error("Saved front-office data is invalid. No changes were made.");
    }
    const migrated = emptyAdminData();
    migrated.selectedTeam = data.selectedTeam;
    migrated.leagueCaps = data.leagueCaps;
    migrated.picks = data.picks;
    for (const { id } of nflTeams) {
      const oldTeam = data.teams[id];
      if (!oldTeam || !Array.isArray(oldTeam.roster) || !oldTeam.seasons) {
        throw new Error("Saved front-office data is invalid. No changes were made.");
      }
      migrated.teams[id] = {
        roster: oldTeam.roster.map((oldPlayer) => {
          if (!oldPlayer || typeof oldPlayer.position !== "string" || typeof oldPlayer.rosterType !== "string" ||
              !oldPlayer.seasons) {
            throw new Error("Saved front-office data is invalid. No changes were made.");
          }
          return {
            id: oldPlayer.id,
            name: oldPlayer.name,
            seasons: Object.fromEntries(adminSeasons.map((year) => [year, {
              ...oldPlayer.seasons[year],
              position: oldPlayer.position,
              rosterType: oldPlayer.rosterType
            }]))
          };
        }),
        seasons: Object.fromEntries(adminSeasons.map((year) => [year, oldTeam.seasons[year]]))
      };
    }
    if (!validAdminData(migrated)) {
      throw new Error("Saved front-office data is invalid. No changes were made.");
    }
    return migrated;
  }

  if (!validAdminData(data)) {
    throw new Error("Saved front-office data is invalid. No changes were made.");
  }
  return data;
}

function renderAdminCaps(data) {
  adminCapRows.replaceChildren();
  for (const year of adminSeasons) {
    const row = adminCapRows.insertRow();
    row.insertCell().textContent = String(year);
    const capCell = row.insertCell();
    capCell.className = "admin-cap-cell";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 12;
    input.inputMode = "decimal";
    input.value = data.leagueCaps[year] === null ? "" : formatAdminCurrency(data.leagueCaps[year]);
    input.placeholder = "Set base cap";
    input.dataset.year = String(year);
    input.dataset.currency = "true";
    input.setAttribute("aria-label", `${year} league-wide base salary cap in dollars`);
    capCell.append(input);
  }
}

function formatAdminCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function parseAdminCurrency(input) {
  const rawValue = input.value.trim().replace(/[$,\s]/g, "");
  if (!/^\d+$/.test(rawValue)) return null;
  const value = Number(rawValue);
  return validInteger(value) ? value : null;
}

let officeData = emptyAdminData();
let safeToSave = true;
let storageAvailable = true;
try {
  const savedData = localStorage.getItem(adminStorageKey);
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    officeData = migrateAdminData(parsedData);
    if (parsedData.version !== officeData.version) {
      localStorage.setItem(adminStorageKey, JSON.stringify(officeData));
    }
  }
} catch (error) {
  storageAvailable = false;
  safeToSave = false;
  adminStorageNotice.textContent = error instanceof SyntaxError
    ? "Saved front-office data could not be read. It has not been overwritten; correct the saved data or restore a valid backup from a team sheet."
    : `${error.message || "Browser storage is unavailable."} No saved data was changed.`;
}

renderAdminCaps(officeData);
if (!safeToSave) {
  adminCapRows.querySelectorAll("input").forEach((input) => { input.disabled = true; });
}

adminCapRows.addEventListener("change", (event) => {
  const input = event.target.closest("[data-year]");
  if (!input) return;
  const year = Number(input.dataset.year);
  const value = input.value.trim() ? parseAdminCurrency(input) : null;
  if (input.value.trim() && (value === null || !input.validity.valid)) {
    input.setCustomValidity("Enter a whole dollar amount, such as $1,000,000.");
    input.reportValidity();
    input.setCustomValidity("");
    input.value = officeData.leagueCaps[year] === null ? "" : formatAdminCurrency(officeData.leagueCaps[year]);
    return;
  }

  const updatedData = {
    ...officeData,
    leagueCaps: { ...officeData.leagueCaps, [year]: value }
  };
  if (storageAvailable) {
    try {
      localStorage.setItem(adminStorageKey, JSON.stringify(updatedData));
    } catch (error) {
      storageAvailable = false;
      adminStorageNotice.textContent = `Could not save this data in browser storage: ${error.message}. Changes are only in memory until storage is available.`;
      input.value = officeData.leagueCaps[year] === null ? "" : formatAdminCurrency(officeData.leagueCaps[year]);
      return;
    }
  }
  officeData = updatedData;
  input.value = value === null ? "" : formatAdminCurrency(value);
  adminStatus.textContent = `${year} league-wide base salary cap ${value === null ? "cleared" : "updated"}.`;
});

adminCapRows.addEventListener("focusin", (event) => {
  const input = event.target.closest("[data-currency='true']");
  if (input) input.value = input.value.replace(/[$,\s]/g, "");
});

adminCapRows.addEventListener("focusout", (event) => {
  const input = event.target.closest("[data-currency='true']");
  const value = input && parseAdminCurrency(input);
  if (input && value !== null) input.value = formatAdminCurrency(value);
});

window.addEventListener("storage", (event) => {
  if (event.key !== adminStorageKey) return;
  try {
    officeData = event.newValue ? migrateAdminData(JSON.parse(event.newValue)) : emptyAdminData();
    renderAdminCaps(officeData);
    adminStatus.textContent = "Front-office updates synced from another tab.";
  } catch (error) {
    adminStatus.textContent = `${error.message || "The update from another tab could not be read."} Current values were not changed.`;
  }
});
