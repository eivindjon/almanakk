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
    const aiInputField = document.getElementById('ai-input');
    const todoListContainer = document.getElementById('todo-list-container');
    const newTodoInput = document.getElementById('new-todo-input');
    const addTodoButton = document.getElementById('add-todo-button-submit');

    // --- VARIABLER ---
    let currentUserId = null;
    let unsubscribeFromTodos = null;

    // --- AUTENTISERING ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            console.log("Bruker logget inn:", currentUserId);
            loginOverlay.classList.remove('active');
            appContainer.style.display = 'grid';
            listenForTodos(currentUserId);
        } else {
            currentUserId = null;
            console.log("Ingen bruker logget inn.");
            loginOverlay.classList.add('active');
            appContainer.style.display = 'none';
            if (unsubscribeFromTodos) {
                unsubscribeFromTodos();
            }
            todoListContainer.innerHTML = '';
        }
    });

    // --- FUNKSJONER (Firestore, Rendering etc.) ---
    function listenForTodos(userId) {
        const todosRef = db.collection('users').doc(userId).collection('todos').orderBy('createdAt', 'desc');
        unsubscribeFromTodos = todosRef.onSnapshot(snapshot => {
            todoListContainer.innerHTML = '';
            snapshot.forEach(doc => renderTodo(doc.data(), doc.id));
        });
    }

    function renderTodo(todo, id) {
        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-item';
        todoDiv.setAttribute('data-id', id);
        if (todo.completed) todoDiv.classList.add('completed');

        todoDiv.innerHTML = `
            <div class="checkbox"></div>
            <div class="text">${todo.text}</div>
            <button class="delete-todo-button">×</button>
        `;
        todoListContainer.appendChild(todoDiv);

        todoDiv.querySelector('.checkbox').addEventListener('click', () => toggleTodoStatus(id, todo.completed));
        todoDiv.querySelector('.delete-todo-button').addEventListener('click', () => deleteTodo(id));
    }

    function addTodo() {
        const text = newTodoInput.value.trim();
        if (text === '' || !currentUserId) return;
        db.collection('users').doc(currentUserId).collection('todos').add({
            text: text,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => newTodoInput.value = '').catch(err => console.error(err));
    }

    function toggleTodoStatus(id, currentStatus) {
        if (!currentUserId) return;
        db.collection('users').doc(currentUserId).collection('todos').doc(id).update({ completed: !currentStatus });
    }

    function deleteTodo(id) {
        if (!currentUserId) return;
        db.collection('users').doc(currentUserId).collection('todos').doc(id).delete();
    }
    
    function getFriendlyErrorMessage(error) { /* ... som før ... */ }

    // --- EVENT LISTENERS ---
    loginButton.addEventListener('click', () => {
        auth.signInWithEmailAndPassword(loginEmailInput.value, loginPasswordInput.value)
            .catch(error => loginError.textContent = getFriendlyErrorMessage(error));
    });

    registerButton.addEventListener('click', () => {
        auth.createUserWithEmailAndPassword(loginEmailInput.value, loginPasswordInput.value)
            .catch(error => loginError.textContent = getFriendlyErrorMessage(error));
    });

    logoutButton.addEventListener('click', () => auth.signOut());
    addTodoButton.addEventListener('click', addTodo);
    newTodoInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') addTodo();
    });

	// --- CLOUD FUNCTION EVENT LISTENER (med korrekt fetch-kall) ---
	if (aiInputField) {
		aiInputField.addEventListener('keyup', (e) => {
			if (e.key === 'Enter' && aiInputField.value.trim() !== '') {
				// Hent den innloggede brukeren
				const user = auth.currentUser;
				if (!user) {
					alert("Du må være logget inn for å bruke denne funksjonen.");
					return;
				}

				const text = aiInputField.value;
				aiInputField.disabled = true;
				aiInputField.classList.add('loading');
				aiInputField.value = "Tenker...";

				// 1. Få brukerens ID-token for autentisering
				user.getIdToken().then(idToken => {
					// 2. Definer URL-en til din Cloud Function
					const functionUrl = 'https://askai-847713150113.europe-west1.run.app';

					// 3. Bruk standard 'fetch' for å kalle funksjonen
					fetch(functionUrl, {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${idToken}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ data: { text: text } })
					})
					.then(response => {
						if (!response.ok) {
							// Håndter feil fra serveren
							throw new Error(`Serveren svarte med status: ${response.status}`);
						}
						return response.json();
					})
					.then(result => {
						console.log("Suksess fra AI:", result.data);
						// Listen oppdateres automatisk!
					})
					.catch(error => {
						console.error("Feil ved kall til fetch:", error);
						alert(`En feil oppstod: ${error.message}`);
					})
					.finally(() => {
						// Rydd opp uansett
						aiInputField.disabled = false;
						aiInputField.classList.remove('loading');
						aiInputField.value = '';
					});
				});
			}
		});
	} else {
		console.warn("AI input-feltet ble ikke funnet.");
	}
});
