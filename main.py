import subprocess
subprocess.run('cls', shell=True)
# circular_queue.py atau main.py

class CircularQueue:
    def __init__(self, size):
        self.maxSize = size
        self.queue = [None] * size
        self.front = -1
        self.rear = -1

    # Memeriksa apakah antrian penuh
    def isFull(self):
        return (self.rear + 1) % self.maxSize == self.front

    # Memeriksa apakah antrian kosong
    def isEmpty(self):
        return self.front == -1

    # Menambah antrian (User baru masuk)
    def enqueue(self, element):
        if self.isFull():
            return False  # Antrian penuh
        
        if self.isEmpty():
            self.front = 0
            
        self.rear = (self.rear + 1) % self.maxSize
        self.queue[self.rear] = element
        return True

    # Mengurangi antrian (User maju ke pemesanan)
    def dequeue(self):
        if self.isEmpty():
            return None  # Antrian kosong
            
        savedElement = self.queue[self.front]
        self.queue[self.front] = None  # Kosongkan slot
        
        if self.front == self.rear:
            # Jika elemen terakhir sudah diambil, reset antrian
            self.front = -1
            self.rear = -1
        else:
            self.front = (self.front + 1) % self.maxSize
            
        return savedElement