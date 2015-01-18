// global variables
var cardSets, skillTypes, units, unitTypes, fusion_recipes, inventory, possible_fusions, errors

// load card database (TUO)
$.get("data/cards.xml", function(data) { 
  var jsonData = xmlToJson(data).root
  cardSets = jsonData.cardSet
  skillTypes = jsonData.skillType
  units = jsonData.unit
  unitTypes = jsonData.unitType
})

// load fusion recipe database (TUO)
$.get("data/fusion_recipes_cj2.xml", function(data) { 
  fusion_recipes = xmlToJson(data).root.fusion_recipe 
})

// button that finds fusions based on inventory
$('.btn-find-fusion-recipes').on('click', function(){
  // reset global variables
  inventory = []
  possible_fusions = []
  errors = []

  // validate inventory cards
  var $inventory = $("#inventory").val().split("\n")
  _.each($inventory, function(name) {
    if(name != "") {
      var quantity = 1

      // check for TUO notation: Tiamat (2), Tiamat #2
      if(name.split("#").length > 1) {
        var temp = name.split("#")
        name = temp[0].replace(" ","")
        quantity = temp[1]
      }
      else if(name.split("(").length > 1) {
        var temp = name.split("(")
        name = temp[0].replace(" ","")
        quantity = temp[1].split(")")[0]
      }

      // check for TUO noation: Tiamat-1 (eight cards have '-' in their name, so we have to validate against that)
      if(name.split("-").length > 1 && name.length - name.indexOf('-') <= 3) {
        name = name.split("-")[0].replace(" ","")
      }

      // find card in card database
      var unit = _.find(units, function(u){ return u.name["#text"].toLowerCase() == name.toLowerCase() })
      console.log(unit)

      if(unit != undefined) {
        if(unit.length == undefined) {
          // card found
          inventory.push({unit: unit, quantity: quantity})
        }
        else {
          // exception of cards that exist multiple times in database (e.g. Apex)
          inventory.push({unit: unit[0], quantity: quantity})        
        }
      }
      else {
        // card not found
        errors.push({name: name})
      }
    }
  })

  // display cards not found to user
  if(errors.length > 0) {
    $(".errors-placeholder").html(templates.error({errors: errors}))
  }

  // find fusions
  // TODO
})

$('.checkbox-dual').on('click', function () {
  $('.fusion-level-dual').toggle()
})

$('.checkbox-quad').on('click', function () {
  $('.fusion-level-quad').toggle()
})

var templates = {
  fusion_recipe: Handlebars.compile($("#fusion-recipe-template").html()),
  resource: Handlebars.compile($("#resource-template").html()),
  error: Handlebars.compile($("#error-template").html())
}