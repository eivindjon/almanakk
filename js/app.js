document.addEventListener('DOMContentLoaded', () => {
    // --- UI-elementer ---
    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.querySelector('.app-container');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const loginError = document.getElementById('login-error');

    // --- TODO UI-elementer ---
    const todoListContainer = document.getElementById('todo-list-container');
    const newTodoInput = document.getElementById('new-todo-input');
    const addTodoButton = document.getElementById('add-todo-button-submit');

    let currentUserId = null;
    let unsubscribeFromTodos = null; // Funksjon for å stoppe lytting på data

    // --- AUTENTISERINGSLOGIKK ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // Bruker er logget inn
            currentUserId = user.uid;
            console.log("Bruker logget inn:", currentUserId);
            loginOverlay.classList.remove('active');
            appContainer.style.display = 'grid';
            
            // Start å hente og lytte på gjøremål for denne brukeren
            listenForTodos(currentUserId);

        } else {
            // Bruker er logget ut
            currentUserId = null;
            console.log("Ingen bruker logget inn.");
            loginOverlay.classList.add('active');
            appContainer.style.display = 'none';

            // Stopp å lytte på data når brukeren logger ut for å unngå feil
            if (unsubscribeFromTodos) {
                unsubscribeFromTodos();
            }
            todoListContainer.innerHTML = ''; // Tøm listen
        }
    });

    // --- FIRESTORE-FUNKSJONER ---

    // 1. Funksjon for å lytte på endringer i sanntid
    function listenForTodos(userId) {
        const todosRef = db.collection('users').doc(userId).collection('todos').orderBy('createdAt', 'desc');

        unsubscribeFromTodos = todosRef.onSnapshot(snapshot => {
            todoListContainer.innerHTML = ''; // Tøm listen før vi tegner den på nytt
            snapshot.forEach(doc => {
                const todo = doc.data();
                const todoId = doc.id;
                renderTodo(todo, todoId); // Tegn hvert gjøremål
            });
        });
    }

    // 2. Funksjon for å tegne ett enkelt gjøremål i listen
    function renderTodo(todo, id) {
        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-item';
        todoDiv.setAttribute('data-id', id);
        if (todo.completed) {
            todoDiv.classList.add('completed');
        }

        todoDiv.innerHTML = `
            <div class="checkbox"></div>
            <div class="text">${todo.text}</div>
            <button class="delete-todo-button">×</button>
        `;

        todoListContainer.appendChild(todoDiv);

        // Legg til event listener for å fullføre/angre
        const checkbox = todoDiv.querySelector('.checkbox');
        checkbox.addEventListener('click', () => toggleTodoStatus(id, todo.completed));

        // Legg til event listener for å slette
        const deleteButton = todoDiv.querySelector('.delete-todo-button');
        deleteButton.addEventListener('click', () => deleteTodo(id));
    }

    // 3. Funksjon for å legge til et nytt gjøremål
    function addTodo() {
        const text = newTodoInput.value.trim();
        if (text === '' || !currentUserId) return;

        db.collection('users').doc(currentUserId).collection('todos').add({
            text: text,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            newTodoInput.value = ''; // Tøm inputfeltet
            console.log("Gjøremål lagt til!");
        }).catch(error => {
            console.error("Feil ved lagring av gjøremål: ", error);
        });
    }

    // 4. Funksjon for å endre status (fullført/ikke fullført)
    function toggleTodoStatus(id, currentStatus) {
        if (!currentUserId) return;
        db.collection('users').doc(currentUserId).collection('todos').doc(id).update({
            completed: !currentStatus
        });
    }

    // 5. Funksjon for å slette et gjøremål
    function deleteTodo(id) {
        if (!currentUserId) return;
        db.collection('users').doc(currentUserId).collection('todos').doc(id).delete();
    }


    // --- EVENT LISTENERS (for innlogging etc.) ---
    loginButton.addEventListener('click', () => { /* ... som før ... */ });
    registerButton.addEventListener('click', () => { /* ... som før ... */ });
    logoutButton.addEventListener('click', () => { auth.signOut(); });
    addTodoButton.addEventListener('click', addTodo);
    newTodoInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addTodo();
        }
    });

    function getFriendlyErrorMessage(error) { /* ... som før ... */ }


    // ... Gammel UI-logikk kan legges til her senere ...
});