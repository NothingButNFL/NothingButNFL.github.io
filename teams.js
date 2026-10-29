const nflTeams = [
  { id: "ARI", name: "Arizona Cardinals", logo: "ari" },
  { id: "ATL", name: "Atlanta Falcons", logo: "atl" },
  { id: "BAL", name: "Baltimore Ravens", logo: "bal" },
  { id: "BUF", name: "Buffalo Bills", logo: "buf" },
  { id: "CAR", name: "Carolina Panthers", logo: "car" },
  { id: "CHI", name: "Chicago Bears", logo: "chi" },
  { id: "CIN", name: "Cincinnati Bengals", logo: "cin" },
  { id: "CLE", name: "Cleveland Browns", logo: "cle" },
  { id: "DAL", name: "Dallas Cowboys", logo: "dal" },
  { id: "DEN", name: "Denver Broncos", logo: "den" },
  { id: "DET", name: "Detroit Lions", logo: "det" },
  { id: "GB", name: "Green Bay Packers", logo: "gb" },
  { id: "HOU", name: "Houston Texans", logo: "hou" },
  { id: "IND", name: "Indianapolis Colts", logo: "ind" },
  { id: "JAX", name: "Jacksonville Jaguars", logo: "jax" },
  { id: "KC", name: "Kansas City Chiefs", logo: "kc" },
  { id: "LV", name: "Las Vegas Raiders", logo: "lv" },
  { id: "LAC", name: "Los Angeles Chargers", logo: "lac" },
  { id: "LAR", name: "Los Angeles Rams", logo: "lar" },
  { id: "MIA", name: "Miami Dolphins", logo: "mia" },
  { id: "MIN", name: "Minnesota Vikings", logo: "min" },
  { id: "NE", name: "New England Patriots", logo: "ne" },
  { id: "NO", name: "New Orleans Saints", logo: "no" },
  { id: "NYG", name: "New York Giants", logo: "nyg" },
  { id: "NYJ", name: "New York Jets", logo: "nyj" },
  { id: "PHI", name: "Philadelphia Eagles", logo: "phi" },
  { id: "PIT", name: "Pittsburgh Steelers", logo: "pit" },
  { id: "SF", name: "San Francisco 49ers", logo: "sf" },
  { id: "SEA", name: "Seattle Seahawks", logo: "sea" },
  { id: "TB", name: "Tampa Bay Buccaneers", logo: "tb" },
  { id: "TEN", name: "Tennessee Titans", logo: "ten" },
  { id: "WAS", name: "Washington Commanders", logo: "wsh" }
];

const teamsDropdown = document.querySelector("#teams-dropdown");
if (teamsDropdown) {
  for (const team of nflTeams) {
    const link = document.createElement("a");
    link.className = "team-menu-link";
    link.href = `team.html?team=${encodeURIComponent(team.id)}`;
    link.setAttribute("role", "menuitem");

    const logoWrap = document.createElement("span");
    logoWrap.className = "team-menu-logo";
    logoWrap.setAttribute("aria-hidden", "true");
    const initials = document.createElement("span");
    initials.className = "team-menu-fallback";
    initials.textContent = team.id;
    const image = document.createElement("img");
    image.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${team.logo}.png`;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.hidden = true;
      initials.hidden = false;
    }, { once: true });
    initials.hidden = true;
    logoWrap.append(image, initials);

    const name = document.createElement("span");
    name.textContent = team.name.slice(team.name.lastIndexOf(" ") + 1);
    const abbreviation = document.createElement("small");
    abbreviation.textContent = team.id;
    link.append(logoWrap, name, abbreviation);
    teamsDropdown.append(link);
  }
}

const teamsMenu = document.querySelector(".teams-menu");
const teamsTrigger = document.querySelector(".teams-trigger");
const mobileMenuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector("#primary-nav");

function closeTeamsMenu() {
  if (!teamsMenu || !teamsTrigger) return;
  teamsMenu.classList.remove("is-open");
  teamsTrigger.setAttribute("aria-expanded", "false");
}

if (teamsMenu && teamsTrigger) {
  teamsTrigger.addEventListener("click", () => {
    const open = teamsTrigger.getAttribute("aria-expanded") === "true";
    teamsTrigger.setAttribute("aria-expanded", String(!open));
    teamsMenu.classList.toggle("is-open", !open);
  });
  teamsDropdown.setAttribute("role", "menu");
  teamsTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      teamsTrigger.setAttribute("aria-expanded", "true");
      teamsMenu.classList.add("is-open");
      teamsDropdown.querySelector("a")?.focus();
    }
  });
  teamsMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTeamsMenu();
      teamsTrigger.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!teamsMenu.contains(event.target)) closeTeamsMenu();
  });
}

if (mobileMenuToggle && siteNavigation) {
  mobileMenuToggle.addEventListener("click", () => {
    const isExpanded = mobileMenuToggle.getAttribute("aria-expanded") === "true";
    mobileMenuToggle.setAttribute("aria-expanded", String(!isExpanded));
    mobileMenuToggle.setAttribute("aria-label", isExpanded ? "Expand navigation" : "Collapse navigation");
    document.querySelector(".site-header")?.classList.toggle("is-open", !isExpanded);
  });
  siteNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mobileMenuToggle.setAttribute("aria-expanded", "false");
      mobileMenuToggle.setAttribute("aria-label", "Expand navigation");
      document.querySelector(".site-header")?.classList.remove("is-open");
      closeTeamsMenu();
    }
  });
}
