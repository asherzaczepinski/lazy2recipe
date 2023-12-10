//have an options and an edit recipe button under the recipe options at the top of it right under enter ingredients
//have simple try catch for error catching
var recipeSection = document.querySelector('#recipe-section');

var recipeForm = document.getElementById('recipe-form')
var recipeInput = document.getElementById('recipe_input');
var recipe_submit = document.getElementById('submit_recipe');
var separators = document.getElementsByClassName('separator')

var recipe = document.getElementById('recipe');
var recipe_loader_area = document.getElementById('recipeloaderarea');
var generation = document.getElementById('generation');
var failedGeneration = document.getElementById('failedGeneration');

const API_KEY = "sk-XLwL5vr6g4QV9hH46"

const API_KEY2 = "TRJT3BlbkFJAIcK7PI02YtL02293pkG"

function toggleLoader(show, targetElement) {
    var existingLoader = document.getElementById('loader');
    if (show) {
        if (!existingLoader) {
            var loader = document.createElement('div');
            loader.id = 'loader';
            // Customize the loader appearance here
            targetElement.appendChild(loader);
        }
    } else if (existingLoader) {
        existingLoader.remove();
    }
}

async function fetchRecipe(userPrompt) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${API_KEY + API_KEY2}`,
        'Content-Type': 'application/json'
    };

    const data = {
        model: "gpt-4",
        messages: [
            { "role": "system", "content": "You are here to make recipes for me." },
            { "role": "user", "content": `
            ${userPrompt}

            If the above is inappropriate or not in anyway a recipe request return: "404ErrorInappropriate" else

            Return the recipe name, ingredients, instructions, and calories. 
            Keep the total ingredients minimal. 
            Keep the response concise. 
            Between and before each thing 
            (recipe name, ingredients, instructions, and calories) 
            put an objc to seperate it.
            Put an obj between and before every ingredient and instruction 
            It should look like this:

            Recipe Name: Recipe Name
            objc
            Ingredients:
            obj
            1. 2 eggs
            obj
            2. 3 cups of milk
            objc
            Instructions:
            obj
            1. Put eggs in a bowl
            obj
            2. Add milk to the bowl
            objc
            Serving Size: (1 ommelete, 2 cups, 1 spoonful, 1/4 ommelette, 1/3 salad, etc...)
            objc
            Total Servings: (1, 3, 5, 4, 2.5)
            objc
            Calories per Serving: (100, 200, 300, 400, 540)
            `}
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

const generateImage = async (description) => {
    const url = 'https://api.openai.com/v1/images/generations';

    const headers = {
        'Authorization': `Bearer ${API_KEY + API_KEY2}`,
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        prompt: description,
        n: 1,
        size: "1024x1024"
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
    });

    if (!response.ok) {
        console.log(response.text())
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
};

const displayImage = async (recipe) => {
    const prompt = `
    ${recipe}
    
    Draw this recipe as appetizingly as possible.`;

    const imageData = await generateImage(prompt);
    if (imageData && imageData.data[0].url) {
        const imageUrl = imageData.data[0].url;
        const imgElement = document.getElementById('generatedImage');

        if (imgElement) {
            return new Promise((resolve, reject) => {
                imgElement.onload = () => {
                    resolve(); // Resolve the promise when image is loaded
                };

                imgElement.onerror = () => {
                    reject('Error loading image'); // Reject the promise if there's an error
                };

                imgElement.src = imageUrl; // Start loading the image
            });
        }
    }
};


recipeForm.onsubmit = async function(event) {
    event.preventDefault();
    (async () => {
        // Construct the URL with any required query parameters
        const url = 'https://us-west2-bulkedalligator.cloudfunctions.net/gen-recipe-clicked';
    
        // Define the requestOptions for a GET request
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
            // No body is needed for a GET request
        };
    
        try {
            const response = await fetch(url, requestOptions);
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("Response from the function:", data);
        } catch (error) {
            console.error("Error calling update_cell function:", error);
        }
    })();
    
    console.log("Form submission started");

    // Reset UI elements
    resetUI();

    if (recipeInput.value != "") {
        recipe_submit.disabled = true;
        recipe_submit.style.backgroundColor = '#60d160';

        // Show loader
        toggleLoader(true, recipe_loader_area);
        console.log("Loader toggled on");

        try {
            const returned = await fetchRecipe(recipeInput.value);
            console.log("Recipe fetched:", returned);

            if (returned.toLowerCase().includes('404errorinappropriate')) {
                throw new Error('Inappropriate recipe');
            }

            let modifiedReturned = returned.replace(/objc/gi, "<br><br><br>");
            modifiedReturned = modifiedReturned.replace(/obj/gi, "<br><br>");
            recipe.innerHTML = modifiedReturned;
            console.log("Recipe HTML updated");

            await displayImage(modifiedReturned);
            generation.classList.remove('hidden');
            console.log("Generation displayed");
        } catch (error) {
            console.error('Error processing recipe:', error);
            generation.classList.add('hidden');
            failedGeneration.classList.remove('hidden');
            console.log("Failed generation displayed");
        } finally {
            resetForm();
            toggleLoader(false, recipe_loader_area);
            console.log("Loader toggled off, form reset");
        }
    }
}

function resetUI() {
    generation.classList.add('hidden');
    failedGeneration.classList.add('hidden');
    recipe.innerHTML = '';
}

function resetForm() {
    recipe_submit.disabled = false;
    recipe_submit.classList.remove('button-disabled');
    recipe_submit.style.backgroundColor = '';
    recipeInput.value = ''; // Reset the input field
}

