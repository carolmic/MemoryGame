const socket = io();
const cards = document.querySelectorAll(".memory-card");
let cardsArray = Array.from(cards);
const flags = [
	{
		src: "/img/br.svg",
		alt: "brazil",
	},
	{
		src: "/img/it.svg",
		alt: "italy",
	},
	{
		src: "/img/fr.svg",
		alt: "france",
	},
	{
		src: "/img/jp.svg",
		alt: "japan",
	},
	{
		src: "/img/au.svg",
		alt: "australia",
	},
	{
		src: "/img/kr.svg",
		alt: "korea",
	},
	{
		src: "/img/br.svg",
		alt: "brazil",
	},
	{
		src: "/img/it.svg",
		alt: "italy",
	},
	{
		src: "/img/fr.svg",
		alt: "france",
	},
	{
		src: "/img/jp.svg",
		alt: "japan",
	},
	{
		src: "/img/au.svg",
		alt: "australia",
	},
	{
		src: "/img/kr.svg",
		alt: "korea",
	},
];

let matches = 0;
let isOver = false;
let hasFlippedCard = false;
let lockBoard = true;
let firstCard, secondCard, indexFirstCard, indexSecondCard;
let currentPlayer, nextPlayer, thisPlayer;
let players = [];

(function startGame() {
	document.getElementById("start-btn").addEventListener("click", () => {
		const name = document.getElementById("name").value;
		document.getElementById("name").disabled = true;
		document.getElementById("start-btn").hidden = true;
		document.getElementById("current-player").hidden = false;
		document.getElementById("current-player-name").hidden = false;
		currentPlayer = { name, points: 0, lockBoard: false };
		thisPlayer = currentPlayer;
		document.getElementById(
			"players-table"
		).innerHTML += `<tr class="player-info"><td class="player-name">${currentPlayer.name}: </td><td id="player-points" class="player-points">${currentPlayer.points}</td></tr>`;
		players.push(currentPlayer);
		document.getElementById(
			"current-player-name"
		).innerHTML = `<p>${currentPlayer.name}</p>`;
		socket.emit("join", currentPlayer);
	});
	document.getElementById("start-game").addEventListener("click", () => {
		document.getElementById("start-game").hidden = true;
		nextPlayer = players.find((player) => player !== currentPlayer);
		nextPlayer.lockBoard = true;
		socket.emit("set turns", { currentPlayer, nextPlayer });
		socket.emit("start game", []);
		lockBoard = true;
		turns();
	});
})();

function turns() {
	if (currentPlayer.name === thisPlayer.name) {
		currentPlayer.lockBoard = false;
		thisPlayer.lockBoard = false;
		nextPlayer.lockBoard = true;
	} else {
		thisPlayer.lockBoard = true;
	}
}

function flipCard() {
	if (thisPlayer.lockBoard || currentPlayer.lockBoard) return;
	if (this === firstCard) return;
	this.classList.add("flip");

	let index = cardsArray.indexOf(this);

	socket.emit("flip card", {
		id: index,
		flag: this.dataset.flag,
	});

	if (!hasFlippedCard) {
		hasFlippedCard = true;
		firstCard = this;
		indexFirstCard = cardsArray.indexOf(this);
		return;
	}

	secondCard = this;
	indexSecondCard = cardsArray.indexOf(this);
	checkForMatch();
}

function checkForMatch() {
	let isMatch = firstCard.dataset.flag === secondCard.dataset.flag;

	if (isMatch) {
		currentPlayer.points++;
		matches++;
		socket.emit("find match", {
			firstCard: firstCard.dataset.flag,
			secondCard: secondCard.dataset.flag,
			currentPlayer: currentPlayer,
			matches: matches,
		});
		socket.emit("set turns", { currentPlayer, nextPlayer });
		document.querySelectorAll(".player-info").forEach((player) => {
			if (player.firstElementChild.textContent.includes(currentPlayer.name)) {
				player.lastElementChild.innerHTML = currentPlayer.points;
			}
		});
		disableCards();
		if (matches === cardsArray.length / 2) {
			socket.emit("finish game", { currentPlayer, nextPlayer });
			finishGame();
			return;
		}
		return;
	} else {
		let currentPlayerValue = currentPlayer;
		currentPlayer = nextPlayer;
		nextPlayer = currentPlayerValue;
		currentPlayer.lockBoard = false;
		nextPlayer.lockBoard = true;
		if (nextPlayer.name === thisPlayer.name) {
			thisPlayer.lockBoard = true;
		}
		document.getElementById(
			"current-player-name"
		).innerHTML = `<p>${currentPlayer.name}</p>`;
		socket.emit("set turns", { currentPlayer, nextPlayer });
	}

	turns();
	unflipCards();
}

function disableCards() {
	firstCard.removeEventListener("click", flipCard);
	secondCard.removeEventListener("click", flipCard);

	resetBoard();
}

function unflipCards() {
	lockBoard = true;

	setTimeout(() => {
		cardsArray[indexFirstCard].classList.remove("flip");
		cardsArray[indexSecondCard].classList.remove("flip");

		socket.emit("unflip cards", {
			firstCard: indexFirstCard,
			secondCard: indexSecondCard,
		});

		resetBoard();
	}, 1500);
}

function resetBoard() {
	[hasFlippedCard, lockBoard] = [false, false];
	[firstCard, secondCard] = [null, null];
}

(function shuffle() {
	for (let i = flags.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[flags[i], flags[j]] = [flags[j], flags[i]];
	}
	for (let i = 0; i < cardsArray.length; i++) {
		let card = cardsArray[i];
		card.firstElementChild.setAttribute("src", flags[i].src);
		card.firstElementChild.setAttribute("alt", flags[i].alt);
		card.setAttribute("data-flag", flags[i].alt);
	}
	socket.emit(
		"set order",
		cardsArray.map((card) => {
			return {
				dataset: card.dataset.flag,
				firstElementChild: {
					src: card.firstElementChild.src,
					alt: card.firstElementChild.alt,
				},
			};
		})
	);
})();

function finishGame() {
	let playerPoints = [currentPlayer.points, nextPlayer.points];
	let maxPoints = Math.max(...playerPoints);
	let winner =
		playerPoints.indexOf(maxPoints) === 0 ? currentPlayer : nextPlayer;
	document.getElementById(
		"current-player"
	).innerHTML = `<p class="winner">${winner.name} wins!</p>`;
	document.getElementById("current-player-name").hidden = true;
	socket.emit("finish game", {
		currentPlayer: currentPlayer,
		nextPlayer: nextPlayer,
	});
}
cards.forEach((card) => card.addEventListener("click", flipCard));

socket.on("game finished", (data) => {
	finishGame();
});

socket.on("card flipped", (data) => {
	const card = cardsArray[data.id];
	if (
		card &&
		!card.classList.contains("flip") &&
		card.getAttribute("data-flag") === data.flag
	) {
		card.classList.add("flip");
	}
});

socket.on("cards unflipped", (data) => {
	const firstCard = cardsArray[data.firstCard];
	const secondCard = cardsArray[data.secondCard];
	if (firstCard && secondCard) {
		firstCard.classList.remove("flip");
		secondCard.classList.remove("flip");
	}
});

socket.on("match found", (data) => {
	document.querySelectorAll(".player-info").forEach((player) => {
		if (player.firstElementChild.textContent.includes(data.currentPlayer.name)) {
			player.lastElementChild.innerHTML = data.currentPlayer.points;
		}
	});
	const allCards = document.querySelectorAll(".memory-card");
	const allCardsArray = Array.from(allCards);
	const matchCards = allCardsArray.filter(
		(card) => card.dataset.flag === data.firstCard
	);
	const firstCard = matchCards[0].classList.add("flip");
	const secondCard = matchCards[1].classList.add("flip");
	matches = data.matches;
	if (matches === cardsArray.length / 2) {
		socket.emit("finish game", {
			currentPlayer: data.currentPlayer,
			nextPlayer: data.nextPlayer,
		});
	}

	if (firstCard && secondCard) {
		firstCard.removeEventListener("click", flipCard);
		secondCard.removeEventListener("click", flipCard);
	}
});

socket.on("order set", (data) => {
	let player2Cards = document.querySelectorAll(".memory-card");

	for (let i = 0; i < player2Cards.length; i++) {
		player2Cards[i].innerHTML = `
			<img src="${data[i].firstElementChild.src}" alt="${data[i].firstElementChild.alt}" class="front-face" />
			<img src="/img/olympics.svg" alt="Olympics" class="back-face" />
		`;
		player2Cards[i].setAttribute("data-flag", data[i].dataset);
	}
});

socket.on("joined", (data) => {
	document.getElementById(
		"players-table"
	).innerHTML += `<tr class="player-info"><td class="player-name">${data.name}: </td><td id="player-points" class="player-points">${data.points}</td></tr>`;
	players.push(data);
});

socket.on("turns set", (data) => {
	nextPlayer = data.nextPlayer;
	currentPlayer = data.currentPlayer;
	document.getElementById("current-player").hidden = false;
	document.getElementById("current-player-name").hidden = false;
	document.getElementById(
		"current-player-name"
	).innerHTML = `<p>${data.currentPlayer.name}</p>`;
	turns();
});

socket.on("game started", (data) => {
	nextPlayer = players.find((player) => player !== data.currentPlayer);
	document.getElementById("start-game").hidden = true;
});
