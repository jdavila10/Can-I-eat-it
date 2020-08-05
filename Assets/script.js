//Declare global variables
var foodName, userAllergy, allergyInput, categoryInput, upcInput, foodImg, safeToEat;
var appID = "64be3214";
var key = "a686c7f46157229e5073aeea40465ccd";
var userSearch = JSON.parse(localStorage.getItem("userSearch")); //get search array from local storage
if (!userSearch) { //if search array is undefined
    userSearch = new Array(); //create a new empty array
}

$(document).ready(function () { //once the HTML is loaded:
    $('.allergy-dropdown').on('click', function (event) { //on click of allergy dropdown
        event.preventDefault(); //prevent page from refreshing
        $('.allergy-dropdown').toggleClass('is-active'); //toggle class to 'is-active' to display or hide the allergy menu
    });

    $('.category-dropdown').on('click', function (event) { //on click of category dropdown
        event.preventDefault(); //prevent page from refreshing
        $('.category-dropdown').toggleClass('is-active'); //toggle class to 'is-active' to display or hide the category menu
    });

    $('.allergy-item').on('click', function (event) { //on click of an allergy from the dropdown
        userAllergy = event.target.text.trim(); //save user selection in variable, trim spaces
        $('#allergy-display').text(userAllergy); //change the dropdown button to display user selection
        convertAllergy(userAllergy); //call function to put allergy in format of API
        $('.allergy-icon').removeClass('icon-has-focus'); //remove focus styling class on all allergy icons
        $('#'+userAllergy.replace(' ', '-')).addClass('icon-has-focus'); //add focus styling to clicked icon
        //replace formats the ID of certain elements correctly, i.e. 'Tree Nuts' to 'Tree-Nuts'
        //userAllergy.replace() does not change the stored value of userAllergy
    });

    $('.allergy-icon').on('click', function (event) { //on click of a allergy icon (allergy-icon)
        userAllergy = event.target.id.trim(); // save user selection in variable
        $('.allergy-icon').removeClass('icon-has-focus'); //remove focus styling class on all allergy icons
        $('#'+userAllergy).addClass('icon-has-focus'); //add focus styling to clicked icon
        userAllergy = userAllergy.replace('-', ' '); // replace '-' in id strings with ' ', (i.e. 'Tree-Nuts' -> 'Tree Nuts')
        $('#allergy-display').text(userAllergy); //change the dropdown button to display user selection
        convertAllergy(userAllergy); //call function to put allergy in format of API
    });

    $('.category-item').on('click', function (event) { //on click of a category from the dropdown
        categoryInput = event.target.text.trim(); //save user selection in variable, trim spaces
        $('#category-display').text(categoryInput); //change dropdown button to display user selection
    });

    $('.submit-btn').on('click', function () { //when search is clicked, validate that they selected inputs, else alert them
        if (!allergyInput) {
            displayModal("Don't forget to choose your allergy!")//alert("Don't forget to choose your allergy!")
        } else if (!categoryInput) {
            displayModal("Don't forget to choose your food category/type!")//alert("Don't forget to choose your food category/type!")
        } else {
            getfoodID();
        }
    });


});

//Function to change allergy to correct format
function convertAllergy(allergy) {
    if (allergy == "Dairy") {
        allergyInput = "DAIRY_FREE";
    } else if (allergy == "Eggs") {
        allergyInput = "EGG_FREE";
    } else if (allergy == "Peanuts") {
        allergyInput = "PEANUT_FREE";
    } else if (allergy == "Soy") {
        allergyInput = "SOY_FREE";
    } else if (allergy == "Wheat") {
        allergyInput = "WHEAT_FREE";
    } else if (allergy == "Tree Nuts") {
        allergyInput = "TREE_NUT_FREE";    
    }
}
//Function to reach API 
function getfoodID() {
    upcInput = $("#barcode-input").val().trim(); //save barcode in variable
    var edamamURL = "https://api.edamam.com/api/food-database/v2/parser?upc=" + upcInput + "&app_id=" + appID + "&app_key=" + key;

    //ajax function with url of the food barcode that we want to reach using GET
    $.get({
        url: edamamURL
    })
        .done(function (response) {
            foodName = response.hints[0].food.label; //get food label of user's barcode input, this is the item name
            userSearch.push(foodName); //update array of food searched
            localStorage.setItem("userSearch", JSON.stringify(userSearch)); //update the array in local storage    
            var foodID = response.hints[0].food.foodId; //get food ID of user's barcode input
            foodImg = response.hints[0].food.image; //get food image of user's barcode input
            getHealthLabel(foodID); //run function to get health labels
        }).fail(function () {//if bad request or request fails
            displayModal("Hmmm...we can't find this item, try again");//alert("Hmmm...we can't find this item, try again") //alert user to try again
        });
}

// Function to create the JSON object for the Edamam API push request, and execution
function getHealthLabel(foodID) {
    var foodJSON = {}; //create object for Edamam API 
    var ingredientsArray = new Array(); //create array
    var foodObject = { foodId: foodID }; //create food Object
    ingredientsArray.push(foodObject); //add to array
    foodJSON.ingredients = ingredientsArray; //foodJSON with property 'ingredients' has value of ingredientsArray
    var url = "https://api.edamam.com/api/food-database/v2/nutrients?app_id=" + appID + "&app_key=" + key;

    $.ajax({
        method: "POST", //post request per Edamam API to get health labels
        url: url,
        headers: {
            "Content-Type": "application/json" //reuqired by Edamam API
        },
        data: JSON.stringify(foodJSON),
    })
        .then(function (response) {
            var healthLabelsArray = response.healthLabels; //Get health labels (e.g. DAIRY-FREE)
            var safe = healthLabelsArray.indexOf(allergyInput); //find index of user's allergy
            if (safe < 0) { //if the health labels does not include the user's allergy (if index is -1)
                safeToEat = "false";
            } else {
                safeToEat = "true";
            }
            storeData(); //call function to store data in local storage
        });
}

//Function to store in Local Storage
function storeData() {
    var foodObject = { //store data as an object that Results Page can use
        name: foodName,
        allergy: userAllergy,
        category: categoryInput,
        item: upcInput,
        searchResult: safeToEat,
        image: foodImg,
    }
    localStorage.setItem(foodName, JSON.stringify(foodObject));
    localStorage.setItem("lastKey", foodName);
    resultsScreen(); //call function to redirect to the Results Screen after data is stored
}
//Function to redirect
function resultsScreen() {
    window.location.href = "./results.html"; //redirect to Results Page
}

// Modals JS control
var rootE1 = $(document.documentElement);
// call displayModal("") instead of alert("")
function displayModal(inputString) {
    rootE1.addClass("is-clipped"); //webpage document gets clipped
    $(".modal").addClass("is-active");
    $(".modal").addClass("is-clipped");
    console.log(inputString);
    $(".modal-text").text(inputString);
}

function closeModal() {
    rootE1.removeClass("is-clipped");
    $(".modal").removeClass("is-active");
}

//if the user presses esc, close the modal
//suggested by Bulma CSS
document.addEventListener("keydown", function (event) {
    var e = event || window.event;
    if (e.keyCode === 27) {
        closeModal();
    }
})
//close modal if use clicks background or the 'X' in the top right corner
$('.modal-background').on('click', function() { closeModal() });
$('.modal-close').on('click', function() { closeModal() });


