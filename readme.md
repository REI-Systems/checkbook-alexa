# Checkbook Alexa Voice Search

##Set up
Follow these steps to get the checkbook Alexa skill deployed to your account. At this stage we are not going to have the app certified and published to Alexa Skills Store. So you can only use it on the Alexa device of your account.

1. Register a new account at https://developer.amazon.com/alexa

2. Use same email address and register a free account at https://aws.amazon.com/
   1. Add a new user at https://console.aws.amazon.com/iam/home?region=us-east-1#/users, add it to a new group with permission of AdministratorAccess policy.
   2. Copy the new user's Access key ID and Secret access key
   3. With above keys, use AWS CLI to config a new profile `checkbookalexa` on your local machine by running `aws configure --profile checkbookalexa`

3. Install ASK CLI. https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html
   run `ask init` to set up a new ask profile, choose `Create new profile`, type in the name `checkbookalexa`, and pick from the list to associate it with the aws profile `checkbookalexa` created in previous step. You will be lead to web sign in page to authenticate the association.

4. Copy `.ask/config.template` to `./ask/config`. No changes needed. Copy `lambda/custom/config.template.js` to `lambda/custom/config.js`, customize it with api server info.

5. run `ask deploy -p checkbookalexa`

##Register your Alexa device
1. register one of your Alexa device to the same developer account at https://alexa.amazon.com
2. the Alexa device is now capable of answering questions about checkbook.

##Talk to Alexa
All questions availble on API https://uat-checkbook-nyc.reisys.com/json_api/ can be asked to Alexa and get proper response. Based on the nature of the subjects, the questions can be asked in two ways:

```
-- Alexa, ask checkbook how many {subject}.
-- Alexa, ask checkbook what is the {subject}.
```

Alexa will prompt you for the year, then you can give the year as 
```
-- 2017
-- fiscal year 2016
-- calendar year 2015
```

Or, you can ask the full questions like these:

```
-- Alexa, ask checkbook how many {subject} for calendar year 2015.
-- Alexa, ask checkbook what is the {subject} in 2017.
```


