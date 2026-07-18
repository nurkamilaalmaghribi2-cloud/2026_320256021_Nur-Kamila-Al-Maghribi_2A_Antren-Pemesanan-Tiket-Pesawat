class CircularQueue {
    constructor(size) {
        this.maxSize = parseInt(size);
        this.queue = new Array(this.maxSize).fill(null);
        this.front = -1;
        this.rear = -1;
    }

    isFull() {
        return (this.rear + 1) % this.maxSize === this.front;
    }

    isEmpty() {
        return this.front === -1;
    }

    enqueue(element) {
        if (this.isFull()) {
            return false;
        }
        if (this.isEmpty()) {
            this.front = 0;
        }
        this.rear = (this.rear + 1) % this.maxSize;
        this.queue[this.rear] = element;
        return true;
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        let element = this.queue[this.front];
        this.queue[this.front] = null;

        if (this.front === this.rear) {
            this.front = -1;
            this.rear = -1;
        } else {
            this.front = (this.front + 1) % this.maxSize;
        }
        return element;
    }
}