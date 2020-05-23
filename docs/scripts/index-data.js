function httpGetAsyncStarForks() {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      var data = JSON.parse(xmlHttp.responseText);
      document.querySelector(".star-count").innerHTML = data.stargazers_count;
      document.querySelector(".fork-count").innerHTML = data.forks_count;
    }
  }
  xmlHttp.open("GET", "https://api.github.com/repos/zodern/meteor-up", true); // true for asynchronous 
  xmlHttp.send(null);
}

function httpGetAsyncCommits() {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      var data = JSON.parse(xmlHttp.responseText);
      var count = 0;
      data.forEach(function (element) {
        count += element.total;
      }, this);
      document.querySelector(".commit-count").innerHTML = count;
      document.querySelector(".contributor-count").innerHTML = data.length;
    }
  }
  xmlHttp.open("GET", "https://api.github.com/repos/zodern/meteor-up/stats/contributors", true); // true for asynchronous 
  xmlHttp.send(null);
}

httpGetAsyncStarForks();
httpGetAsyncCommits();

const maxVisibleSponsors = 11;

function mergeDonations(donations) {
  let groupedByAccount = donations.reduce((result, donation) => {
    if (donation.fromAccount.name in result) {
      result[donation.fromAccount.name].totalDonations.value += donation.totalDonations.value;
    } else {
      result[donation.fromAccount.name] = donation;
    }

    return result;
  }, {});

  return Object.values(groupedByAccount);
}

function createMoreLink(count) {
  return `
    <div class="card more-link">
      <h3>And ${count} more</h3>
      <a class="button" href="https://opencollective.com/meteor-up">Sponsor</a>
    </div>
  `
}

function createSponsor(sponsor) {
  const card = `
    <div class="card">
      <img src="${sponsor.fromAccount.imageUrl}" width="50" height="50" />
      <h3>${sponsor.fromAccount.name}</h3>
      <span>$${sponsor.totalDonations.value}</span>
    </div>
  `

  if (sponsor.fromAccount.website) {
    return `
      <a href="${sponsor.fromAccount.website}">
        ${card}
      </a>
    `
  }

  return card
}

fetch('https://rest.opencollective.com/v2/meteor-up/orders/incoming?status=active,cancelled,paid&limit=1000')
  .then(response => response.json())
  .then((data) => {
    const donations = mergeDonations(data.nodes)
    const sponsors = donations
      .sort((sponsorA, sponsorB) => {
        return sponsorB.totalDonations.value - sponsorA.totalDonations.value;
      })
      .slice(0, maxVisibleSponsors)
      .map(sponsor => createSponsor(sponsor))

    const moreDetails = createMoreLink(donations.length - sponsors.length);

    document.querySelector('#sponsor-list').innerHTML = sponsors.join(' ') + moreDetails;
  })
