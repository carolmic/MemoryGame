const socket = io();
const cards = document.querySelectorAll(".memory-card");

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

function flipCard() {
	if (lockBoard) return;
	if (this === firstCard) return;

	this.classList.add("flip");

	socket.emit("flip card", {
		id: this.dataset.flag,
	});

	if (!hasFlippedCard) {
		hasFlippedCard = true;
		firstCard = this;
		return;
	}

	secondCard = this;
	checkForMatch();
}

function checkForMatch() {
	let isMatch = firstCard.dataset.flag === secondCard.dataset.flag;

	if (isMatch) {
		socket.emit("find match", {
			firstCard: firstCard.dataset.flag,
			secondCard: secondCard.dataset.flag
		});
		disableCards();
		return;
	}

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
		firstCard.classList.remove("flip");
		secondCard.classList.remove("flip");

		socket.emit("unflip cards", {
			firstCard: firstCard.dataset.flag,
			secondCard: secondCard.dataset.flag
		});

		resetBoard();
	}, 1500);
}

function resetBoard() {
	[hasFlippedCard, lockBoard] = [false, false];
	[firstCard, secondCard] = [null, null];
}

(function shuffle() {
	cards.forEach((card) => {
		let randomPos = Math.floor(Math.random() * 12);
		card.style.order = randomPos;
	});
})();

cards.forEach((card) => card.addEventListener("click", flipCard));

socket.on("card flipped", (data) => {
	const card = document.querySelector(`.memory-card[data-flag="${data.id}"]`);
	if (card) {
		card.classList.add("flip");
	}
});

socket.on("cards unflipped", (data) => {
	const firstCard = document.querySelector(`.memory-card[data-flag="${data.firstCard}"]`);
	const secondCard = document.querySelector(`.memory-card[data-flag="${data.secondCard}"]`);
	if (firstCard && secondCard) {
		firstCard.classList.remove("flip");
		secondCard.classList.remove("flip");
	}
});

socket.on("match found", (data) => {
	const firstCard = document.querySelector(`.memory-card[data-flag="${data.firstCard}"]`);
	const secondCard = document.querySelector(`.memory-card[data-flag="${data.secondCard}"]`);
	if (firstCard && secondCard) {
		firstCard.removeEventListener("click", flipCard);
		secondCard.removeEventListener("click", flipCard);
	}
});
