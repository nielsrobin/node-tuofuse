// global variables
var cardSets, skillTypes, units, unitTypes, fusion_recipes, inventory, possible_fusions, errors, fusions

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
  fusions = []

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

  // create fusion list with units (TODO: move this to a preloader.. takes forever!)
  _.each(fusion_recipes, function(fusion_recipe){
    if(fusion_recipe.resource != undefined) {
      var fusion = {
        fusion_recipe: fusion_recipe,
        unit: getUnitFromID(fusion_recipe.card_id["#text"]),
        unit_resources: []
      }

      _.each(fusion_recipe.resource, function(resource){
        var unit = getUnitFromID(resource["@attributes"] != undefined ? resource["@attributes"].card_id : resource.card_id)
        fusion.unit_resources.push({unit: unit, resource: resource})
      })

      fusions.push(fusion)
    }
  })

  findPossibleFusions()

  // hack to get quads (TODO: find a better way)
  _.each(possible_fusions, function(possible_fusion) {
    inventory.push({unit: possible_fusion.unit, quantity: getQuantity(possible_fusion)})
  })
  possible_fusions = []

  findPossibleFusions()

  $(".fusion-recipes-results").html(templates.fusion_recipe(getFusionsViewModel()))

  console.log("done!")
})

function getQuantity(possible_fusion) {
  var smallest = 999
  _.each(possible_fusion.unit_resources, function(unit_resource) {
    if((unit_resource.haveOrMakeCard.quantity / (unit_resource.resource["@attributes"] != undefined ? unit_resource.resource["@attributes"].number : unit_resource.resource.number) < smallest)) smallest = (unit_resource.haveOrMakeCard.quantity / (unit_resource.resource["@attributes"] != undefined ? unit_resource.resource["@attributes"].number : unit_resource.resource.number))
  })

  if(smallest != 999) {
    return { type: "make", quantity: smallest}
  }
}

function findPossibleFusions() {  
  _.each(fusions, function(fusion){
    var flag = false

    if(fusion.unit_resources == undefined) {
      console.log(fusion)
    }
    else if(fusion.unit_resources.length != undefined) {
      _.each(fusion.unit_resources, function(unit_resource){ 
        unit_resource.haveOrMakeCard = haveOrMakeCard(unit_resource.unit.id["#text"])
        if(unit_resource.haveOrMakeCard.type == "have" || unit_resource.haveOrMakeCard.type == "make") flag = true
      })
    }
    else {
        fusion.unit_resources.haveOrMakeCard = haveOrMakeCard(fusion.unit_resources.unit.id["#text"])
        if(fusion.unit_resources.haveOrMakeCard.type == "have" || unit_resource.haveOrMakeCard.type == "make") flag = true
    }

    if(flag) possible_fusions.push(fusion)
  })
}

function getUnitFromID(card_id) {
  return _.find(units, function(unit){ 
      return card_id == unit.id["#text"] 
        || (unit.upgrade != undefined ? (unit.upgrade.length != undefined ?
        _.contains(
          _.reduceRight(unit.upgrade, function(list, upgrade){ 
            return list.concat(upgrade.card_id["#text"]) }
          , [])
        , card_id) : card_id == unit.upgrade.card_id["#text"] ) : false)
  })
}

function haveOrMakeCard (card_id) {
  // do we have the unit?
  var unitInInventory = _.filter(inventory, function(inventory_item){
    return inventory_item.unit.id["#text"] == card_id
  })
  if(unitInInventory.length > 0) {
    return { type: "have", quantity: _.reduce(unitInInventory, function(memo, num){ return memo + num.quantity }, 0)}
  }

  // can we make the unit? (replaced by quad-hack)
  /*
  var fusion_recipe = _.find(fusion_recipes, function(fusion_recipe) { return fusion_recipe.card_id["#text"] == card_id })
  if(fusion_recipe != undefined) {
    if(fusion_recipe.resource != undefined) {
      var makeables = []
      if(fusion_recipe.resource.length != undefined) {
        _.each(fusion_recipe.resource, function(resource){
          makeables.push(haveOrMakeCard(resource["@attributes"] != undefined ? getUnitFromID(resource["@attributes"].card_id).id["#text"] : getUnitFromID(resource.card_id).id["#text"]))
        })
      }
      else {
          makeables.push(haveOrMakeCard(fusion_recipe.resource["@attributes"] != undefined ? getUnitFromID(fusion_recipe.resource["@attributes"].card_id).id["#text"] : getUnitFromID(fusion_recipe.resource.card_id).id["#text"]))
      }

      if(makeables.length > 0) {
        var smallest = 999
        _.each(makeables, function(makeable) {
          if(makeable.quantity < smallest) smallest = makeable.quantity
        })

        if(smallest != 999) {
          return { type: "make", quantity: smallest}
        }
      }
    }
  }
  */

  // don't have and cannot make
  return { type: "cannot" }
}

function getFusionsViewModel(){
  var viewModels = []
  _.each(possible_fusions, function(fusion){
    var viewModel = { 
      name: fusion.unit.name["#text"], 
      fusion_level: fusion.unit.fusion_level["#text"] == "2" ? "quad" : "dual",
      resources: []
    }

    _.each(fusion.unit_resources, function(unit_resource){
      viewModel.resources.push({
        status: unit_resource.haveOrMakeCard.type == "cannot" ? "danger" : (unit_resource.haveOrMakeCard.quantity >= (unit_resource.resource["@attributes"] != undefined ? unit_resource.resource["@attributes"].number : unit_resource.resource.number) ? "success" : "warning"),
        name: unit_resource.unit.name["#text"],
        number: unit_resource.resource.number
      })
    })

    viewModels.push(viewModel)
  })

  return {fusionViewModels: viewModels}
}

$('.checkbox-dual').on('click', function () {
  $('.fusion-level-dual').toggle()
})

$('.checkbox-quad').on('click', function () {
  $('.fusion-level-quad').toggle()
})

var templates = {
  fusion_recipe: Handlebars.compile($("#fusion-recipe-template").html()),
  error: Handlebars.compile($("#error-template").html())
}