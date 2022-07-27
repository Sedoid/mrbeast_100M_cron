require('coffee-script/register')
require('dotenv').config()

const urlParser = require("url-parse")
const cron = require("node-cron")
const queryParse = require("query-string")
const express =  require('express')
const cors = require('cors')
const body_parser = require('body-parser')
const { google } = require('googleapis')
const request = require('request')
const { default: axios, Axios } = require('axios')
const node_mailer = require('node-mailer')
const app = express()
var tokens = {}
var task = undefined;
const port = 4000
const Target = 100000000
var subscriptionID = undefined

// https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername=MrBeast6000&key={{youtube_api}}
// https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCX6OQ3DkcsbYNE6H8uQQuVA&key={{youtube_api}}

    const idealSubscriberCount = async(token) =>{
        try{
            result = await axios({
                method: "GET",
                url:`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCX6OQ3DkcsbYNE6H8uQQuVA&key=${process.env.YoutubeAPI}`
            })

            console.log(`*********  MrBeast Current Sub's Count  ***********`)
            const current_sub_count = result.data.items[0].statistics.subscriberCount
            const difference = Target - current_sub_count
            console.log('Subscriber Count: '+ current_sub_count)
            console.log('Difference: '+ +difference)
            console.log('Target Difference:'+ 100000)

            if(difference > 100000 ){
                console.log('Cron Job Status: Waiting')
            }else{
                console.log('Cron Job Status: Active'+ '\n')
                // Subscribe Dynamically
                subscribe(token)
                // Wait for 3 seconds then check if i am the  100,000,000
                const intervalID = setInterval(function(){
                    subscriberCount(token)
                    clearInterval(intervalID)
                },3000)   

            }
        }catch(err){
            console.log(err)
        }
    }

    const deleteSubscription = async(token) =>{
        try{
            
            const result = axios({
                method: "DELETE",
                url: `https://youtube.googleapis.com/youtube/v3/subscriptions?id=${subscriptionID}&key=${process.env.YoutubeAPI}`,
                headers:{
                    Authorization: "Bearer "+ token, 
                },
                "Content-Type": "application/json",
            })

                console.log('successfully deleted subscription')


        }catch(err){
            console.log('****** Error in deleting sub *******')
        }
    }

    const subscriberCount = async(token) => {
        
        try{

            result = await axios({
                method: "GET",
                url:`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCX6OQ3DkcsbYNE6H8uQQuVA&key=${process.env.YoutubeAPI}`
            })

            console.log(`*********  Sub's Count  ***********`)
            const current_sub_count = result.data.items[0].statistics.subscriberCount
            const difference = Target - current_sub_count
            console.log('Current SubscriberCount: '+ current_sub_count)
            console.log('Difference: '+ difference)

            if(difference > 1){
                console.log('*******  Deleting Subscription')
                deleteSubscription(token)
            }
            else if(difference == 0){
                task.stop()
            }


        }catch(err){
            console.log(`*********  Sub Count Error  ***********`)
            console.log(err.response)
        }
    }

    const subscribe = async(token) =>{

        try{
            const result = await axios({
                method: "POST",
                headers:{
                    Authorization: "Bearer "+ token, 
                },
                "Content-Type": "application/json",
                url:`https://youtube.googleapis.com/youtube/v3/subscriptions?part=snippet&key=${process.env.YoutubeAPI}`,
                data:{
                    "snippet": {
                        "resourceId": {
                        "kind": "youtube#channel",
                        "channelId": "UCX6OQ3DkcsbYNE6H8uQQuVA"
                        }
                    }  
                }
            })

            console.log("************** Newly Subscribed **************")       
            subscriptionID = result.data.id
            console.log('New Subscription Id :' + subscriptionID)
        }catch(err){
            console.log("************** Subscription error *************")

        }    
    }


    app.use(cors())

    const oauth2Client = new google.auth.OAuth2(
        process.env.ClientId,
        process.env.ClientSecrete,
        process.env.return_url
    )

    const scope = ["profile email openid","https://www.googleapis.com/auth/youtube"]

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scope,
        state: JSON.stringify({})
    })

    request(url,(err,response,body) =>{
        if(err)
            console.log("error",err);
        else{
            console.log('\n')
            console.log("Gen-Auth-Url status Code",response && response.statusCode)
            console.log("Proceed to authenticate with the link below:")
            console.log(url) 
            console.log('\n')
        }
            

    })

    
    

app.get('/work',async(req,res) =>{
    console.log("-------> You are now Authenticated ")
    const queryUrl = new urlParser(req.url);
    const code = queryParse.parse(queryUrl.query).code;
    const oauth2Client = new google.auth.OAuth2(
        process.env.ClientId,
        process.env.ClientSecrete,
        process.env.return_url
    )

    tokens = await oauth2Client.getToken(code);

        task = cron.schedule('* * * * *', () =>  {
            console.log('\n')
            console.log('Trusting the Process 😁');
            console.log('\n')

            idealSubscriberCount(tokens.tokens.access_token)

        });
          

    res.send("Authenticated Successffully, go back to the Terminal")

})

app.listen(port,() =>{ console.log(`Server Running on port ${port}`)})


