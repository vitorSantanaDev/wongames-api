const cartGamesIds = async (cartItems) => {
  return await cartItems.map((item) => ({ id: item.id }));
};

const cartItems = async (cart) => {
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

  return games;
};

const total = async (games) => {
  const amount = await games.reduce((acc, game) => (acc += game.price), 0);
  return Number((amount * 100).toFixed(0));
};

module.exports = {
  cartItems,
  total,
  cartGamesIds,
};
