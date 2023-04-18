function myFetch(endpoint, config = {}) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(config.method || "GET", endpoint);
        request.responseType = "json";

        if (config.headers) {
            Object.keys(config.headers).forEach(header => {
                request.setRequestHeader(header, config.headers[header]);
            });
        }

        request.addEventListener("load", () => {
            resolve(request.response);
        });

        request.addEventListener("error", () => {
            reject(new Error("customFetch encountered an error"));
        });

        request.send(config.body);
    });
}


const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        });
    };

    const updateTodo = (id, newTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "PATCH",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        });
    };

    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        });
    };

    const getTodos = () => {
        return myFetch("http://localhost:3000/todos");
    };
    return { createTodo, updateTodo, deleteTodo, getTodos };
})();


const Model = (() => {
    class State {
        #todos; //private field
        #onChange; //function, will be called when setter function todos is called
        constructor() {
            this.#todos = [];
        }
        get todos() {
            return this.#todos;
        }
        set todos(newTodos) {
            // reassign value
            console.log("setter function");
            this.#todos = newTodos;
            this.#onChange?.(); // rendering
        }

        subscribe(callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback;
        }
    }
    const { getTodos, createTodo, updateTodo, deleteTodo } = APIs;
    return {
        State,
        getTodos,
        createTodo,
        updateTodo,
        deleteTodo,
    };
})();


const View = (() => {
    const todolistEl = document.querySelector(".pending");
    const completedlistEl = document.querySelector(".completed")
    const submitBtnEl = document.querySelector(".submit-btn");
    const inputEl = document.querySelector(".input");

    const renderTodos = (todos) => {
        const todopendingitem = todos.filter((todo) => {
            return !todo.completed;
        })
        console.log(todopendingitem);

        const todocompleteditem = todos.filter((todo) => {
            return todo.completed;
        })
        console.log(todocompleteditem);

        let todosTemplate = "";

        todopendingitem.forEach((todo) => {
            const liTemplate = `
                <li class = "">
                    <span id="edit/${todo.id}" contentEditable="false">${todo.content}</span>
                    <img class="edit-btn" id="edit-btn/${todo.id}" src="https://as2.ftcdn.net/v2/jpg/01/26/87/67/1000_F_126876798_soy1iiOvmfU7hAXIVmgy7Ahjpip5zrsh.jpg" alt="Edit" style="width: 20px; height: 20px;"/>
                    <img class="delete-btn" id="delete-btn/${todo.id}" src="https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX22809156.jpg" alt="Delete" style="width: 20px; height: 20px;"/>
                    <img class="move-btn" id="move-btn/${todo.id}" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUYk9nwaZZRR8E2aUjB9_LmHynJCoU_kNLuQAUlFLMSQ&s" alt="Move" style="width: 20px; height: 20px;"/>
                </li>
                `;
            todosTemplate += liTemplate;
        });


        let completedTemplate = "";

        todocompleteditem.forEach((todo) => {
            const comTemplete = `
            <li>
                <img class="move-btn" id="move-btn/${todo.id}" src="https://images.all-free-download.com/images/graphiclarge/green_globe_left_arrow_558.jpg" alt="Move" style="width: 20px; height: 20px;"/>
                <span id="edit/${todo.id}" contentEditable="false">${todo.content}</span>
                <img class="edit-btn" id="edit-btn/${todo.id}" src="https://as2.ftcdn.net/v2/jpg/01/26/87/67/1000_F_126876798_soy1iiOvmfU7hAXIVmgy7Ahjpip5zrsh.jpg" alt="Edit" style="width: 20px; height: 20px;"/>
                <img class="delete-btn" id="delete-btn/${todo.id}" src="https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX22809156.jpg" alt="Delete" style="width: 20px; height: 20px;"/>
            </li>`;
            completedTemplate += comTemplete;
        })

        if (todopendingitem.length === 0) {
            todosTemplate = "<h4>no task to display!</h4>";
        }
        if (todocompleteditem.length === 0) {
            completedTemplate = "<h4>no task to display!</h4>";
        }

        todolistEl.innerHTML = todosTemplate;
        completedlistEl.innerHTML = completedTemplate;
    };

    const clearInput = () => {
        inputEl.value = "";
    };

    return {
        renderTodos,
        submitBtnEl,
        inputEl,
        clearInput,
        todolistEl,
        completedlistEl
    };
})();


const Controller = ((view, model) => {
    const state = new model.State();
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse();
            state.todos = todos;
        });
    };

    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            /* 
                1. read the value from input
                2. post request
                3. update view
            */
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, completed: false }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handleDelete = () => {
        //event bubbling
        /* 
            1. get id
            2. make delete request
            3. update view, remove
        */
        view.todolistEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id.split("/")[1];
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
                console.log("Delete Success");
            }
        });

        view.completedlistEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id.split("/")[1];
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
                console.log("Delete Success");
            }
        })
    };

    const handleEdit = () => {
        view.todolistEl.addEventListener("click", (event) => {
            console.log("Edit button clicked");
            if (event.target.className === "edit-btn") {
                const id = event.target.id.split("/")[1];

                const spanEl = event.target.parentElement.querySelector("span"); /*Dealing with span tag*/
                const contenteditable = spanEl.getAttribute("contenteditable");
                spanEl.setAttribute("contenteditable", contenteditable === "false" ? "true" : "false");
                // https://www.w3schools.com/jsref/met_html_focus.asp
                spanEl.focus()

                // https://www.w3schools.com/jsref/tryit.asp?filename=try_dom_body_contenteditable
                if (spanEl.getAttribute("contenteditable") === 'false') {
                    const todo = state.todos.find(todo => todo.id == id);
                    todo.content = spanEl.innerHTML; // update todo content
                    model.updateTodo(+id, todo).then((data) => {
                        state.todos = [...state.todos];
                    });
                }
            }
        })

        view.completedlistEl.addEventListener("click", (event) => {
            console.log("Edit button clicked");
            if (event.target.className === "edit-btn") {
                const id = event.target.id.split("/")[1];

                const spanEl = event.target.parentElement.querySelector("span"); /*Dealing with span tag*/
                const contenteditable = spanEl.getAttribute("contenteditable");
                spanEl.setAttribute("contenteditable", contenteditable === "false" ? "true" : "false");
                spanEl.focus()

                // https://www.w3schools.com/jsref/tryit.asp?filename=try_dom_body_contenteditable
                if (spanEl.getAttribute("contenteditable") === 'false') {
                    const todo = state.todos.find(todo => todo.id == id);
                    todo.content = spanEl.innerHTML; // update todo content
                    model.updateTodo(+id, todo).then((data) => {
                        state.todos = [...state.todos];
                    });
                }
            }
        })
    }

    const handleMove = () => {
        view.todolistEl.addEventListener("click", (event) => {
            console.log("Move button clicked");
            if (event.target.className === "move-btn") {
                const id = event.target.id.split("/")[1];
                const todo = state.todos.find(todo => todo.id == id);
                todo.completed = !todo.completed;
                model.updateTodo(+id, todo).then((data) => {
                    state.todos = [...state.todos];
                });

            }
        })

        view.completedlistEl.addEventListener("click", (event) => {
            console.log("Move button clicked");
            if (event.target.className === "move-btn") {
                const id = event.target.id.split("/")[1];
                const todo = state.todos.find(todo => todo.id == id);
                todo.completed = !todo.completed;
                model.updateTodo(+id, todo).then((data) => {
                    state.todos = [...state.todos];
                });
            }
        })
    }


    const bootstrap = () => {
        init();
        handleSubmit();
        handleDelete();
        handleEdit();
        handleMove();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model); //ViewModel

Controller.bootstrap();
