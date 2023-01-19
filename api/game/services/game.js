"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require("axios");
const jsdom = require("jsdom");
const slugify = require("slugify");
const queryString = require("querystring");

const timeOut = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Exception = (error) => ({ error, data: error?.data?.errors });

const getByName = async (name, entityName) => {
  try {
    const item = await strapi.services[entityName].find({ name });
    return item.length ? item[0] : null;
  } catch (error) {
    console.info("getByName: ", Exception(error));
  }
};

const create = async (name, entityName) => {
  try {
    const item = await getByName(name, entityName);

    if (!item) {
      return await strapi.services[entityName].create({
        name,
        slug: slugify(name, { lower: true }),
      });
    }
  } catch (error) {
    console.info("create: ", Exception(error));
  }
};

const createManyToManyData = async (products) => {
  try {
    const developers = {};
    const publishers = {};
    const categories = {};
    const platforms = {};

    products.forEach((product) => {
      const { developer, publisher, genres, supportedOperatingSystems } =
        product;

      genres &&
        genres.forEach((item) => {
          categories[item] = true;
        });

      supportedOperatingSystems &&
        supportedOperatingSystems.forEach((item) => {
          platforms[item] = true;
        });

      developers[developer] = true;
      publishers[publisher] = true;
    });

    return Promise.all([
      ...Object.keys(developers).map((name) => create(name, "developer")),
      ...Object.keys(publishers).map((name) => create(name, "publisher")),
      ...Object.keys(categories).map((name) => create(name, "category")),
      ...Object.keys(platforms).map((name) => create(name, "platform")),
    ]);
  } catch (error) {
    console.info("createManyToManyData: ", Exception(error));
  }
};

const createGame = async (product) => {
  try {
    const item = await getByName(product.title, "game");

    if (!item) {
      console.info(`Creating: ${product.title}...`);
      const game = await strapi.services.game.create({
        name: product.title,
        slug: product.slug.replace(/_/g, "-"),
        price: product.price.amount,
        release_date: new Date(
          Number(product.releaseDate) * 1000
        ).toISOString(),
        categories: await Promise.all(
          product.genres.map((name) => getByName(name, "category"))
        ),
        platforms: await Promise.all(
          product.supportedOperatingSystems.map((name) =>
            getByName(name, "platform")
          )
        ),
        developers: [await getByName(product.developer, "developer")],
        publisher: await getByName(product.publisher, "publisher"),
        ...(await getGameInfo(product.slug)),
      });

      await setImage({ image: product.image, game });

      await Promise.all(
        product.gallery
          .slice(0, 5)
          .map((url) => setImage({ image: url, game, field: "gallery" }))
      );

      await timeOut(1500);
      return game;
    }
  } catch (error) {
    console.info("createGame: ", Exception(error));
  }
};

const createGames = async (products) => {
  try {
    await Promise.all(products.map(createGame));
  } catch (error) {
    console.info("createGames: ", Exception(error));
  }
};

const setImage = async ({ image, game, field = "cover" }) => {
  try {
    const url = `https:${image}_bg_crop_1680x655.jpg`;
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(data, "base64");

    const FormData = require("form-data");
    const formData = new FormData();

    formData.append("refId", game.id);
    formData.append("ref", "game");
    formData.append("field", field);
    formData.append("files", buffer, { filename: `${game.slug}.jpg` });

    console.info(`Uploading ${field} image: ${game.slug}.jpg`);

    await axios({
      method: "POST",
      url: `http://${strapi.config.host}:${strapi.config.port}/upload`,
      data: formData,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      },
    });
  } catch (error) {
    console.info("setImage: ", Exception(error));
  }
};

const getGameInfo = async (slug) => {
  try {
    const { JSDOM } = jsdom;
    const { data } = await axios.get(`https://www.gog.com/game/${slug}`);
    const dom = new JSDOM(data);
    const description = dom.window.document.querySelector(".description");

    return {
      rating: "BR0",
      short_description: description.textContent.slice(0, 160) ?? "",
      description: description.innerHTML ?? "",
    };
  } catch (error) {
    console.info("getGameInfo: ", Exception(error));
  }
};

module.exports = {
  populate: async (params) => {
    try {
      const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&${queryString.stringify(
        params
      )}`;

      const {
        data: { products },
      } = await axios.get(gogApiURL);

      await createManyToManyData(products);
      await createGames(products);
    } catch (error) {
      console.info("populate: ", Exception(error));
    }
  },
};
