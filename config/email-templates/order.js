const subject = "Order at Won Games";

const text = `
Hi <%= user.username %>, thanks for buying at Won Games!
Follow the info of your order:
Card Information:
Card brand: <%= payment.card_brand %>
Card number: **** **** **** <%= payment.card_last4 %>
Total: <%= payment.total %>
Games:
<% _.forEach(games, function(game) { %>
  <%= game.name %> - Price: $<%= game.price %>
<% }); %>
`;

const html = /*html*/ `
<p>Hi <%= user.username %>, thanks for buying at Won Games!</p>
<p>Follow the info of your order:</p>
<h3>Card Information</h3>
<ul>
  <li><strong>Card brand:</strong> <%= payment.card_brand %></li>
  <li><strong>Card number:</strong> **** **** **** <%= payment.card_last4 %></li>
</ul>
<h3>Total: <%= payment.total %></h3>
<span style="background-color: #F231A5; height: 1px; display: block; margin: 16px 0;"></span>
<p style="color: white;">Games</p>
<ul>
  <% _.forEach(games, function(game) { %>
    <li><a style="color: #F231A5;" href="http://localhost:3000/game/<%= game.slug %>"><%= game.name %></a> - Price: <strong>$<%= Number(game.price).toFixed(2) %></strong></li>
  <% }); %>
</ul>
<span style="background-color: #F231A5; height: 1px; display: block; margin: 16px 0;"></span>
<strong>$<%= new Date().getFullYear() %></strong>
`;

module.exports = { subject, html, text };
