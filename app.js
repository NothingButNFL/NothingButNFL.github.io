const standings = [
  { name: "Portland Pioneers", monogram: "PDX", conference: "East", record: { w: 8, l: 3, t: 0, streak: "W 3" } },
  { name: "Brooklyn Borough", monogram: "BKN", conference: "East", record: { w: 7, l: 4, t: 0, streak: "W 1" } },
  { name: "Austin Armadillos", monogram: "ATX", conference: "East", record: { w: 6, l: 5, t: 0, streak: "L 1" } },
  { name: "Detroit Foundry", monogram: "DTF", conference: "East", record: { w: 4, l: 7, t: 0, streak: "L 2" } },
  { name: "Seattle Evergreens", monogram: "SEA", conference: "West", record: { w: 9, l: 2, t: 0, streak: "W 4" } },
  { name: "Phoenix Scorch", monogram: "PHX", conference: "West", record: { w: 7, l: 4, t: 0, streak: "W 2" } },
  { name: "Nashville Sound", monogram: "NSH", conference: "West", record: { w: 5, l: 6, t: 0, streak: "L 1" } },
  { name: "Raleigh Redtails", monogram: "RAL", conference: "West", record: { w: 3, l: 8, t: 0, streak: "L 3" } }
];

const standingsBody = document.querySelector("#standings-body");
const standingsPanel = document.querySelector("#standings-panel");
const conferenceCaption = document.querySelector("#conference-caption");

function percentage({ w, l, t }) {
  const games = w + l + t;
  return games ? ((w + t / 2) / games).toFixed(3).replace(/^0/, "") : ".000";
}

function renderStandings(conference) {
  const entries = standings
    .filter((team) => team.conference === conference)
    .sort((a, b) => percentage(b.record).localeCompare(percentage(a.record)));

  standingsBody.innerHTML = entries.map((team, index) => `
    <tr>
      <td>${String(index + 1).padStart(2, "0")}</td>
      <td><span class="standing-team"><span class="team-monogram">${team.monogram}</span>${team.name}</span></td>
      <td>${team.record.w}</td><td>${team.record.l}</td><td>${team.record.t}</td>
      <td>${percentage(team.record)}</td><td>${team.record.streak}</td>
    </tr>`).join("");
  standingsPanel.setAttribute("aria-labelledby", `tab-${conference.toLowerCase()}`);
  conferenceCaption.textContent = `${conference.toUpperCase()}ERN CONFERENCE · SAMPLE`;

  document.querySelectorAll(".tab-button").forEach((tab) => {
    const active = tab.dataset.conference === conference;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
}

document.querySelectorAll(".tab-button").forEach((tab) => {
  tab.addEventListener("click", () => renderStandings(tab.dataset.conference));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextConference = tab.dataset.conference === "East" ? "West" : "East";
      document.querySelector(`[data-conference="${nextConference}"]`).focus();
      renderStandings(nextConference);
    }
  });
});

const interestForm = document.querySelector("#interest-form");
const applicationResult = document.querySelector("#application-result");
const applicationMessage = document.querySelector("#application-message");
interestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!interestForm.reportValidity()) return;

  const formData = new FormData(interestForm);
  const name = formData.get("name").trim();
  const interest = formData.get("interest");
  const note = formData.get("note").trim();
  applicationMessage.value = [
    `Hi! I'm ${name}, and I'm interested in joining the football GM league.`,
    `I'm especially interested in: ${interest}.`,
    note ? `My GM style: ${note}` : "",
    "I'd love to hear more about the league and available next steps."
  ].filter(Boolean).join("\n\n");
  applicationResult.hidden = false;
  document.querySelector("#copy-status").textContent = "Introduction ready. Copy it, then share it with your league's commissioner.";
  applicationResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#copy-application").addEventListener("click", async () => {
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(applicationMessage.value);
    status.textContent = "Copied. Share your introduction through the league's usual community channel.";
  } catch {
    applicationMessage.focus();
    applicationMessage.select();
    status.textContent = "Select the introduction above and copy it to share with your commissioner.";
  }
});

renderStandings("East");
