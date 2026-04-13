# AI Slot Machine

# Model
We will be using [Gemni Code Assist](https://codeassist.google/).

Specifically, we will use Gemini 2.5 Pro. 

To get a one month free trial of Gemini Pro: https://gemini.google/students/. 

# Setup

https://geminicli.com/

1. Open the command line and navigate to a directory you trust Gemini to make changes in (e.g. CSE 110 folder).

2. Run ```npm install -g @google/gemini-cli```.

3. Run ```gemini``` to open the Gemini CLI. 

4. Connect to your Gemini account by signing in. 


# Test Runs (Part 1)

1. On the CSE 110 Repo, navigate to the `ai-slot-machine\step-1` directory. 

2. Create a new candidate directory, and `cd` inside it. 

3. Run ```gemini -m gemini-2.5-pro --approval-mode yolo```. 

    - `-m gemini-2.5-pro` sets the model choice to Gemini 2.5 Pro. 
    - `--approval-mode yolo` allows the model to create and edit files, and run any other commands. `yolo` is used over `auto_edit` as sometimes in `auto_edit` the model stops and prompts the user for confirmation. 

4. Once in the Gemini CLI, run ```/memory show``` to check if any context is present. If there is no context, `no memory` should appear. 

5. To log the current time in ISO 8601, type `!` to switch to shell mode, and then run the shell command that prints the current time. On Windows: 

    ```! powershell -c "(Get-Date).ToUniversalTime().ToString('o')"```

    To exit shell mode, hit `esc`. 

6. Copy the prompt and hit enter: 
    
    `Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens.`

7. Once the model finishes running, run

    ```/stats session```

    ```/stats model``` 

    to retrieve relevant info. 

8. To see things like ISO timestamp and lines of code, feel free to ask Gen AI to help write some shell scripts to do this for you! Examples: 

    ```Get-Date -Format "o"```
    
    ```(Get-ChildItem -Recurse -File -Exclude *.txt | Get-Content | Measure-Object -Line).Lines```


