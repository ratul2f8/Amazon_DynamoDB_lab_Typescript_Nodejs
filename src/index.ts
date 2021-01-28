import * as AWS from "aws-sdk";
import fs from "fs";
import {
  CreateTableInput,
  GetItemInput,
  PutItemInput ,
  UpdateItemInput,
} from "aws-sdk/clients/dynamodb";
import {
  Info, MovieInfo
} from "./type";
import path from "path";
AWS.config.update({
  region: "ap-south-1", //your dynamodb region
  dynamodb: {
    endpoint: "http://localhost:8000", //your dynamdb end point
  },
});

//create table
const dynamodb = new AWS.DynamoDB();
var params: CreateTableInput = {
  TableName: "Movies",
  KeySchema: [
    { AttributeName: "year", KeyType: "HASH" }, //partitionKey
    { AttributeName: "title", KeyType: "Range" },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "year",
      AttributeType: "N",
    },
    {
      AttributeName: "title",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};
//create table
dynamodb.createTable(params, (err, data) => {
  if (err) {
    console.error(
      "Unable to create table. Error JSON:",
      JSON.stringify(err, null, 2)
    );
  } else {
    console.log(
      "Created table. Table description JSON:",
      JSON.stringify(data, null)
    );
  }
});

//load sample data
const pushData = async() => {
    const docClient = new AWS.DynamoDB.DocumentClient();
    console.log("parsing data from json");
    let dataPath = path.join(__dirname, "../moviedata.json");
    var allMovies:[MovieInfo] = await JSON.parse(fs.readFileSync( dataPath, 'utf-8'));
    console.log("inserting data into DynamoDB");
    await allMovies.forEach(async (movie, index) => {
        if(index < 100){
            let params:PutItemInput = {
                TableName: "Movies",
                Item: {
                    "year": movie.year as any,
                    "title": movie.title as any,
                    "info": movie.info as any
                }
            }
            await docClient.put(params, (err, _)=> {
                if(err){
                    throw new Error(JSON.stringify(err, null, 2))
                }else{
                    console.log("PutItem succeeded:", movie.title);
                }
            })
        }
        return;
    })
}
pushData()

//retreive data
const getData = async (year: number, title: string) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  let params: GetItemInput = {
    TableName: "Movies",
    Key: {
      year: year as any,
      title: title as any,
    },
  };
  await docClient.get(params, (err, data) => {
    if (err) {
      console.error(
        "Unable to read item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("GetItem succeeded:", data);
    }
  });
};
getData(2013, "Rush"); //remember if not found it will return an empty object

//update an item
interface UpdateParams {
  title?: string;
  year?: number;
}
const updateEntity = async (keys: UpdateParams, updatedObject: Info) => {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let params: UpdateItemInput = {
    TableName: "Movies",
    Key: {
      year: keys.year as any,
      title: keys.title as any,
    },
    UpdateExpression: "set info.rating = :r, info.plot = :p, info.actors = :a",
    ExpressionAttributeValues: {
      ":r": updatedObject.rating as any,
      ":p": updatedObject.plot as any,
      ":a": updatedObject.actors as any,
    },
    ReturnValues: "UPDATED_NEW",
  };
  await docClient.update(params, (err, data) => {
    if (err) {
      console.error(
        "Unable to update item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("After update:", data);
    }
  });
};
updateEntity(
  { year: 2013, title: "Rush" },
  {
    rating: 5.5,
    actors: ["John", "Bob"],
    plot: "Everything happens all at once.",
  }
);




//delete
const deleteItem = () => {
    var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Movies";

var year = 2013;
var title = "Rush";

var params = {
    TableName:table,
    Key:{
        "year": year,
        "title": title
    },
    ConditionExpression:"info.rating >= :val",
    ExpressionAttributeValues: {
        ":val": 5.0
    }
};

console.log("Attempting a conditional delete...");
docClient.delete(params, function(err, data) {
    if (err) {
        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
    }
});

}
deleteItem() 