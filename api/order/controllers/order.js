"use strict";

const stripe = require("stripe")(process.env.STRIPE_PRIVET_KEY);

module.exports = {
  createPaymentIntent: async (ctx) => {
    const { cart } = ctx.request.body;

    const games = [];

    await Promise.all(
      cart?.map(async (game) => {
        const validatedGame = await strapi.services.game.findOne({
          id: game.id,
        });

        if (validatedGame) {
          games.push(validatedGame);
        }
      })
    );

    if (!games.length) {
      ctx.response.status = 404;
      return {
        error: "No valid games found!",
      };
    }

    const total = +(
      games.reduce((acc, game) => (acc += game.price), 0) * 100
    ).toFixed(0);

    if (total === 0) return { freeGames: true };

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        metadata: { integration_check: "accept_a_payment" },
      });

      return paymentIntent;
    } catch (error) {
      return {
        error: error.raw.message,
      };
    }
  },
};
