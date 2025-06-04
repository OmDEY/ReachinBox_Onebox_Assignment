// elasticSearch.js
const { Client } = require('@opensearch-project/opensearch');
require("dotenv").config(); 

// const client = new Client({
//   node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
// });

const client = new Client({
  node: process.env.ES_URL
});

async function checkConnection() {
  try {
    const health = await client.cluster.health();
    if (health && health.body && health.body.status) {
      console.log('Elasticsearch cluster health:', health.body.status);
    } else {
      // console.log('Unexpected response from Elasticsearch:', health);
    }
  } catch (err) {
    console.error('Elasticsearch connection error:', err);
  }
}

checkConnection();

module.exports = client;
