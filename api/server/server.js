const fs = require('fs');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const url = process.env.DB_URL;
const port = process.env.API_SERVER_PORT;

let db;

const productList = async () => db.collection('products').find({}).toArray();

const getNextSequence = async (id) => {
  const result = await db
    .collection('counters')
    .findOneAndUpdate(
      { _id: id },
      { $inc: { current: 1 } },
      { returnOriginal: false },
    );
  return result.value.current;
}

const addProduct = async (_, { product }) => {
  const newProduct = { ...product };
  newProduct.id = await getNextSequence('products');

  const result = await db.collection('products').insertOne(newProduct);
  const savedProduct = await db.collection('products')
    .findOne({ _id: result.insertedId });
  return savedProduct;
};

const resolvers = {
  Query: {
    productList,
  },
  Mutation: {
    addProduct,
  },
};

const connectToDb = async () => {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync('./server/schema.graphql', 'utf-8'),
  resolvers,
});

const app = express();

app.use(express.static('public'));

server.start().then(async () => {
  server.applyMiddleware({ app, path: '/graphql' });
  await connectToDb();
  app.listen({ port: port }, () =>
    console.log('UI started on port 8000'),
    console.log('API started on port 3000 and GraphQL Studio Sandbox accessible at localhost:3000' + server.graphqlPath)
  );
});