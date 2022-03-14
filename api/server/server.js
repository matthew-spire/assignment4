const fs = require('fs');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const DBNAME = process.env.DBNAME;
const url = process.env.DB_URL || 'mongodb://localhost/productList';

let db;

const productList = async () => db.collection(DBNAME).find({}).toArray();

const addProductToDb = async (_, { product }, id) => {
  const insertProduct = { ...product };
  insertProduct.id = id;
  const result = await db.collection(DBNAME).insertOne(insertProduct);
  return db
    .collection(DBNAME)
    .findOne({ _id: result.insertedID });
}


const addProduct = (_, { product }) => {
  return productList().then((result) => {
    addProductToDb(_, { product }, result[result.length - 1].id + 1).then( r => r);
  });
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
  app.listen({ port: 3000 }, () =>
    console.log('UI started on port 8000'),
    console.log('API started on port 3000 and GraphQL Studio Sandbox accessible at localhost:3000' + server.graphqlPath)
  );
});