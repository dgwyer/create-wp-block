#!/usr/bin/env node
const inquirer = require("inquirer");
const argv = require("yargs").argv;
const values = require("./input-data");
const chalk = require("chalk");
const chalkPipe = require("chalk-pipe");

console.log("Welcome to create-wp-plugin\n");
console.log("[v1.0.1] Nothing to see yet, but coming soon...\n");
return;

if (argv.ships > 3 && argv.distance < 53.5) {
  console.log("Plunder more riffiwobbles!");
} else {
  console.log("Retreat from the xupptumblers!");
}

const questions = [
  {
    type: "list",
    name: "coffeType",
    message: "Choose coffee type",
    choices: values.typesPlain
  },
  {
    type: "list",
    name: "sugarLevel",
    message: "Choose your sugar level",
    choices: values.sugarPlain
  },
  {
    type: "confirm",
    name: "decaf",
    message: "Do you prefer your coffee to be decaf?",
    default: false
  },
  {
    type: "confirm",
    name: "cold",
    message: "Do you prefer your coffee to be cold?",
    default: false
  },
  {
    type: "list",
    name: "servedIn",
    message: "How do you prefer your coffee to be served in",
    choices: values.servedIn
  },
  {
    type: "confirm",
    name: "stirrer",
    message: "Do you prefer your coffee with a stirrer?",
    default: true
  },
  {
    type: "input",
    name: "first_name",
    message: "What's your first name"
  },
  {
    type: "input",
    name: "last_name",
    message: "What's your last name",
    default: function() {
      return "Doe";
    }
  },
  {
    type: "input",
    name: "fav_color",
    message: "What's your favorite color",
    transformer: function(color, answers, flags) {
      const text = chalkPipe(color)(color);
      if (flags.isFinal) {
        return text;
      }
      return text;
    }
  }
];

inquirer.prompt(questions).then(function(answers) {
  console.log(answers);

  // dir as option to specify folder name that's different from plugin name >>> --dir="wpgoplugins"
});
