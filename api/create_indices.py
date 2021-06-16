import unittest

def get_spiral_index(index: int, size: int) -> int:
    return index

class Tests(unittest.TestCase):

    def test_size2(self):
        # size=2:
        # 0 1    0 1
        # 2 3    3 2
        self.assertEqual(get_spiral_index(index=0, size=2), 0)
        self.assertEqual(get_spiral_index(index=1, size=2), 1)
        self.assertEqual(get_spiral_index(index=2, size=2), 3)
        self.assertEqual(get_spiral_index(index=3, size=2), 2)

    def test_size3(self):
        # size=3:
        # 0 1 2    6 7 8
        # 3 4 5    5 0 1
        # 6 7 8    4 3 2
        self.assertEqual(get_spiral_index(index=0, size=2), 4)
        self.assertEqual(get_spiral_index(index=1, size=2), 5)
        self.assertEqual(get_spiral_index(index=2, size=2), 8)
        self.assertEqual(get_spiral_index(index=3, size=2), 7)
        self.assertEqual(get_spiral_index(index=4, size=2), 6)
        self.assertEqual(get_spiral_index(index=5, size=2), 3)
        self.assertEqual(get_spiral_index(index=6, size=2), 0)
        self.assertEqual(get_spiral_index(index=7, size=2), 1)
        self.assertEqual(get_spiral_index(index=8, size=2), 2)
        self.assertEqual(get_spiral_index(index=3, size=2), 3)

    def test_size4(self):
        # size=4:
        # 00 01 02 03    06 07 08 09
        # 04 05 06 07    05 00 01 10
        # 08 09 10 11    04 03 02 11
        # 12 13 14 15    15 14 13 12
        self.assertEqual(get_spiral_index(index=0, size=2), 5)
        self.assertEqual(get_spiral_index(index=1, size=2), 6)
        self.assertEqual(get_spiral_index(index=2, size=2), 10)
        self.assertEqual(get_spiral_index(index=3, size=2), 9)
        self.assertEqual(get_spiral_index(index=4, size=2), 8)
        self.assertEqual(get_spiral_index(index=5, size=2), 4)
        self.assertEqual(get_spiral_index(index=6, size=2), 0)
        self.assertEqual(get_spiral_index(index=7, size=2), 1)
        self.assertEqual(get_spiral_index(index=8, size=2), 2)
        self.assertEqual(get_spiral_index(index=9, size=2), 3)
        self.assertEqual(get_spiral_index(index=10, size=2), 7)
        self.assertEqual(get_spiral_index(index=11, size=2), 11)
        self.assertEqual(get_spiral_index(index=12, size=2), 15)
        self.assertEqual(get_spiral_index(index=13, size=2), 14)
        self.assertEqual(get_spiral_index(index=14, size=2), 13)
        self.assertEqual(get_spiral_index(index=15, size=2), 12)


if __name__ == '__main__':
    unittest.main()
