import json
import math
import os
from typing import Dict
from typing import Optional

import asyncclick as click
from core import logging
from core.http.basic_authentication import BasicAuthentication
from core.requester import Requester
from core.util import file_util
from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont

from mdtp.ipfs_manager import IpfsManager

IMAGE_SIZE = 1000
GRID_COUNT = 25
GRID_SIZE = IMAGE_SIZE / GRID_COUNT
COLOR_GRID = (255, 255, 255, int(0.15 * 255))
COLOR_CUBE = (255, 255, 255, int(0.6 * 255))
GREY = (100, 100, 100)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
FONT = ImageFont.truetype("./fonts/RobotoSlab-Black.ttf", 96)
VALID_TOKEN_IDS = [
  1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 15, 16, 17, 24, 30, 33, 42, 50, 51, 69, 99, 100, 101, 102, 103, 104, 108, 109, 115, 116, 117, 151, 152, 201, 202, 203, 204, 215, 216, 217, 301, 302, 303, 304, 333, 365, 369, 394, 401, 402, 403, 404, 420, 555, 610, 611, 612, 666, 710, 711, 712, 774, 775, 777, 810, 811, 812, 846, 847, 874, 875, 888, 911, 913, 914, 915, 946, 947, 951, 999, 1000, 1013, 1014, 1015, 1024, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060, 1061, 1062, 1113, 1114, 1115, 1138, 1139, 1140, 1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162, 1238, 1239, 1240, 1241, 1242, 1243, 1244, 1245, 1246, 1247, 1248, 1249, 1250, 1251, 1252, 1253, 1254, 1255, 1256, 1257, 1258, 1259, 1260, 1261, 1262, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344, 1345, 1346, 1347, 1348, 1349, 1350, 1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1392, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451, 1452, 1453, 1454, 1455, 1456, 1457, 1458, 1459, 1460, 1461, 1462, 1526, 1527, 1528, 1529, 1550, 1551, 1552, 1553, 1554, 1580, 1626, 1627, 1628, 1629, 1632, 1650, 1651, 1652, 1653, 1654, 1720, 1726, 1727, 1728, 1729, 1750, 1751, 1752, 1753, 1754, 1776, 1786, 1826, 1827, 1828, 1829, 1850, 1851, 1852, 1853, 1854, 1872, 1950, 1951, 1952, 1953, 1954, 2000, 2002, 2012, 2026, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054, 2126, 2138, 2139, 2140, 2141, 2142, 2143, 2144, 2145, 2146, 2147, 2148, 2149, 2150, 2151, 2152, 2153, 2154, 2215, 2216, 2217, 2226, 2265, 2326, 2340, 2401, 2402, 2426, 2445, 2450, 2465, 2466, 2565, 2566, 2582, 2616, 2625, 2682, 2729, 2730, 2735, 2737, 2738, 2739, 2740, 2745, 2750, 2751, 2752, 2753, 2754, 2755, 2756, 2757, 2758, 2771, 2772, 2773, 2829, 2830, 2837, 2838, 2839, 2840, 2850, 2851, 2852, 2853, 2854, 2855, 2856, 2857, 2858, 2871, 2872, 2873, 2937, 2938, 2939, 2940, 2946, 2950, 2951, 2952, 2953, 2954, 2955, 2956, 2957, 2958, 2971, 2972, 2973, 3000, 3021, 3029, 3037, 3038, 3039, 3040, 3047, 3048, 3050, 3051, 3052, 3053, 3054, 3055, 3056, 3057, 3058, 3067, 3121, 3137, 3138, 3141, 3147, 3148, 3150, 3151, 3152, 3153, 3154, 3157, 3160, 3229, 3236, 3237, 3238, 3245, 3246, 3250, 3251, 3252, 3253, 3254, 3266, 3267, 3268, 3269, 3270, 3271, 3319, 3320, 3321, 3322, 3323, 3333, 3345, 3346, 3348, 3349, 3350, 3351, 3352, 3353, 3354, 3366, 3367, 3368, 3369, 3370, 3372, 3403, 3414, 3419, 3420, 3421, 3422, 3423, 3448, 3449, 3450, 3452, 3453, 3454, 3456, 3459, 3460, 3461, 3466, 3467, 3468, 3469, 3470, 3503, 3514, 3519, 3520, 3521, 3522, 3523, 3538, 3539, 3540, 3541, 3542, 3543, 3544, 3545, 3546, 3547, 3548, 3549, 3550, 3552, 3553, 3554, 3559, 3560, 3561, 3566, 3567, 3568, 3569, 3570, 3614, 3619, 3620, 3621, 3622, 3623, 3631, 3632, 3633, 3634, 3635, 3636, 3638, 3639, 3640, 3641, 3642, 3643, 3644, 3645, 3646, 3647, 3648, 3649, 3650, 3651, 3652, 3653, 3654, 3655, 3656, 3659, 3660, 3661, 3666, 3667, 3668, 3669, 3670, 3714, 3719, 3720, 3721, 3722, 3723, 3727, 3731, 3732, 3733, 3734, 3735, 3736, 3737, 3738, 3739, 3740, 3741, 3742, 3743, 3744, 3745, 3746, 3747, 3748, 3749, 3750, 3751, 3752, 3753, 3754, 3755, 3756, 3757, 3758, 3759, 3760, 3761, 3762, 3763, 3766, 3774, 3779, 3780, 3814, 3817, 3831, 3832, 3833, 3834, 3835, 3836, 3837, 3838, 3839, 3840, 3841, 3842, 3843, 3844, 3845, 3846, 3847, 3848, 3849, 3850, 3851, 3852, 3853, 3854, 3855, 3856, 3857, 3858, 3859, 3860, 3861, 3862, 3863, 3864, 3879, 3880, 3885, 3886, 3914, 3931, 3932, 3933, 3934, 3935, 3936, 3937, 3938, 3939, 3940, 3941, 3942, 3943, 3944, 3945, 3946, 3947, 3948, 3949, 3950, 3951, 3952, 3953, 3954, 3955, 3956, 3957, 3958, 3959, 3960, 3961, 3962, 3963, 3964, 3985, 3986, 4014, 4031, 4032, 4033, 4034, 4035, 4037, 4063, 4064, 4114, 4124, 4129, 4130, 4131, 4132, 4133, 4134, 4135, 4136, 4137, 4163, 4164, 4165, 4167, 4168, 4214, 4228, 4229, 4230, 4231, 4232, 4233, 4234, 4235, 4236, 4237, 4263, 4264, 4265, 4267, 4268, 4269, 4274, 4275, 4276, 4285, 4286, 4287, 4314, 4319, 4328, 4329, 4330, 4331, 4332, 4333, 4335, 4336, 4337, 4363, 4364, 4365, 4367, 4368, 4371, 4385, 4386, 4387, 4427, 4428, 4429, 4430, 4431, 4432, 4433, 4436, 4437, 4463, 4464, 4465, 4466, 4485, 4486, 4487, 4525, 4526, 4527, 4528, 4529, 4530, 4531, 4532, 4533, 4534, 4536, 4537, 4563, 4564, 4565, 4566, 4567, 4568, 4577, 4622, 4623, 4624, 4625, 4626, 4627, 4628, 4629, 4630, 4631, 4632, 4633, 4634, 4635, 4636, 4637, 4663, 4664, 4665, 4666, 4667, 4668, 4669, 4717, 4718, 4719, 4722, 4723, 4724, 4725, 4726, 4727, 4728, 4729, 4730, 4731, 4732, 4733, 4734, 4735, 4736, 4737, 4763, 4764, 4765, 4766, 4767, 4768, 4773, 4774, 4817, 4818, 4822, 4823, 4824, 4825, 4826, 4827, 4828, 4829, 4830, 4831, 4832, 4833, 4834, 4835, 4836, 4837, 4863, 4864, 4865, 4866, 4867, 4868, 4873, 4874, 4922, 4923, 4924, 4925, 4926, 4927, 4928, 4929, 4930, 4931, 4932, 4933, 4934, 4935, 4936, 4937, 4963, 4964, 4965, 4966, 4968, 4969, 4970, 4971, 4972, 4973, 4974, 4975, 4989, 5000, 5008, 5013, 5014, 5017, 5022, 5023, 5024, 5025, 5026, 5027, 5028, 5029, 5030, 5031, 5032, 5033, 5034, 5035, 5036, 5037, 5063, 5064, 5065, 5066, 5067, 5068, 5069, 5070, 5071, 5072, 5073, 5074, 5090, 5097, 5113, 5114, 5125, 5126, 5129, 5130, 5131, 5132, 5133, 5134, 5135, 5136, 5137, 5163, 5164, 5165, 5166, 5167, 5168, 5169, 5170, 5171, 5172, 5173, 5174, 5189, 5225, 5226, 5229, 5230, 5231, 5232, 5233, 5234, 5235, 5236, 5237, 5263, 5264, 5265, 5266, 5267, 5268, 5269, 5270, 5271, 5272, 5273, 5274, 5299, 5329, 5330, 5331, 5332, 5333, 5334, 5335, 5336, 5337, 5363, 5364, 5365, 5368, 5369, 5370, 5371, 5372, 5431, 5432, 5433, 5434, 5435, 5436, 5437, 5463, 5464, 5465, 5466, 5467, 5468, 5469, 5470, 5471, 5526, 5531, 5532, 5533, 5534, 5535, 5536, 5537, 5563, 5564, 5565, 5566, 5567, 5568, 5569, 5570, 5571, 5575, 5587, 5622, 5631, 5632, 5633, 5634, 5635, 5636, 5637, 5663, 5664, 5665, 5666, 5667, 5668, 5669, 5670, 5694, 5695, 5731, 5732, 5733, 5734, 5735, 5736, 5737, 5763, 5764, 5765, 5766, 5767, 5768, 5769, 5793, 5794, 5795, 5796, 5811, 5831, 5832, 5833, 5834, 5835, 5836, 5837, 5863, 5864, 5865, 5866, 5867, 5868, 5869, 5893, 5894, 5895, 5896, 5911, 5927, 5928, 5933, 5934, 5935, 5936, 5937, 5963, 5964, 5966, 5967, 5972, 5993, 5994, 5995, 5996, 6011, 6022, 6027, 6028, 6033, 6034, 6035, 6036, 6037, 6038, 6039, 6040, 6041, 6042, 6043, 6044, 6045, 6046, 6047, 6048, 6049, 6050, 6051, 6052, 6053, 6054, 6055, 6056, 6057, 6058, 6059, 6060, 6061, 6062, 6063, 6064, 6066, 6067, 6079, 6093, 6094, 6095, 6096, 6111, 6127, 6128, 6132, 6133, 6134, 6135, 6136, 6137, 6138, 6139, 6140, 6141, 6142, 6143, 6144, 6145, 6146, 6147, 6148, 6149, 6150, 6151, 6152, 6153, 6154, 6155, 6156, 6157, 6158, 6159, 6160, 6161, 6163, 6174, 6193, 6194, 6195, 6196, 6211, 6233, 6234, 6235, 6236, 6237, 6240, 6241, 6243, 6244, 6245, 6246, 6247, 6248, 6249, 6250, 6251, 6252, 6253, 6254, 6255, 6256, 6257, 6258, 6259, 6261, 6262, 6293, 6294, 6295, 6296, 6311, 6333, 6334, 6335, 6340, 6341, 6343, 6344, 6345, 6346, 6347, 6348, 6349, 6350, 6351, 6352, 6353, 6354, 6355, 6356, 6357, 6358, 6359, 6361, 6362, 6365, 6393, 6394, 6395, 6396, 6411, 6433, 6434, 6435, 6443, 6444, 6445, 6446, 6447, 6448, 6449, 6450, 6451, 6452, 6453, 6454, 6455, 6456, 6457, 6458, 6459, 6460, 6461, 6462, 6470, 6493, 6494, 6495, 6496, 6511, 6517, 6518, 6519, 6520, 6521, 6522, 6523, 6524, 6529, 6539, 6543, 6544, 6545, 6546, 6547, 6548, 6549, 6550, 6552, 6553, 6554, 6555, 6556, 6557, 6558, 6559, 6560, 6561, 6562, 6611, 6617, 6618, 6619, 6620, 6621, 6622, 6623, 6624, 6634, 6643, 6644, 6645, 6646, 6647, 6648, 6649, 6650, 6652, 6653, 6654, 6660, 6661, 6662, 6666, 6711, 6717, 6718, 6719, 6720, 6721, 6722, 6723, 6724, 6729, 6743, 6744, 6745, 6746, 6747, 6748, 6761, 6817, 6818, 6819, 6820, 6821, 6822, 6823, 6824, 6834, 6835, 6836, 6843, 6844, 6845, 6846, 6847, 6848, 6855, 6934, 6935, 6942, 6969, 6973, 6983, 7050, 7051, 7061, 7062, 7083, 7094, 7132, 7133, 7134, 7135, 7150, 7151, 7161, 7162, 7232, 7233, 7234, 7235, 7332, 7333, 7334, 7335, 7432, 7433, 7434, 7435, 7487, 7488, 7515, 7532, 7533, 7534, 7535, 7547, 7585, 7587, 7588, 7632, 7633, 7634, 7635, 7688, 7761, 7762, 7763, 7764, 7765, 7777, 7861, 7862, 7863, 7864, 7865, 7958, 7959, 7961, 7962, 7963, 7964, 7965, 8037, 8038, 8039, 8058, 8059, 8061, 8062, 8063, 8064, 8065, 8137, 8138, 8139, 8161, 8162, 8163, 8164, 8165, 8214, 8237, 8238, 8239, 8386, 8447, 8627, 8750, 8760, 8761, 8762, 8763, 8797, 8838, 8839, 8860, 8861, 8862, 8863, 8867, 8868, 8869, 8870, 8888, 8911, 8912, 8938, 8939, 8943, 8960, 8961, 8962, 8963, 8967, 8968, 8969, 8970, 9000, 9042, 9043, 9044, 9045, 9060, 9061, 9062, 9063, 9142, 9143, 9144, 9145, 9177, 9200, 9242, 9243, 9244, 9245, 9301, 9342, 9343, 9344, 9345, 9401, 9480, 9501, 9538, 9559, 9601, 9701, 9743, 9796, 9797, 9798, 9896, 9897, 9898, 9901, 9950, 9996, 9997, 9998, 9999, 10000,
]
FUNNY_NUMBERS = {
    69: 'Sex God',
    420: 'Baked',
    6969: 'Partay',
    4269: 'Wake-n-Bake',
    1729: 'Balaji'
}

def is_prime(n):
    if (n % 2 == 0):
        return False
    for i in range(3, int(n**0.5 + 1), 2):
        if (n % i == 0):
            return False
    return True

def is_square(n):
    if n<1:
        return False
    else:
        for i in range(int(n/2)+1):
            if (i*i)==n:
                return True
        return False

def is_perfect_square(x):
   s = int(math.sqrt(x))
   return s*s == x

def is_fibonacci(n):
   return is_perfect_square(5*n*n + 4) or is_perfect_square(5*n*n - 4)

def get_traits(tokenId: int) -> Dict[str, str]:
    traits = {}
    tokenX = int((tokenId - 1) % 100)
    tokenY = int((tokenId - 1) / 100)
    if tokenX >= 37 and tokenX <= 61 and tokenY >= 40 and tokenY <= 59:
        location = 'Central'
    elif tokenX < 50 and tokenY < 50:
        location = 'North-West'
    elif tokenX >= 50 and tokenY < 50:
        location = 'North-East'
    elif tokenX < 50 and tokenY >= 50:
        location = 'South-West'
    elif tokenX >= 50 and tokenY >= 50:
        location = 'South-East'
    traits['Location'] = location
    if tokenId in {1, 100, 9901, 10000}:
        traits['Position'] = 'Corner'
    elif tokenId <= 100 or tokenId >= 9901 or tokenId % 100 == 1 or tokenId % 100 == 99:
        traits['Position'] = 'Edge'
    elif tokenId in {5050, 5051, 5150, 5151}:
        traits['Position'] = 'Middle'
    else:
        traits['Position'] = None
    specialNumber = FUNNY_NUMBERS.get(tokenId)
    # if not specialNumber:
    #     if '69' in str(tokenId):
    #         specialNumber = 'Sexy'
    traits['Special'] = specialNumber or None
    traits['OG'] = 'Yes' if tokenId in VALID_TOKEN_IDS else 'No'
    if is_fibonacci(tokenId):
        traits['Math'] = 'Fibonacci'
    elif is_prime(tokenId):
        traits['Math'] = 'Prime'
    elif is_square(tokenId):
        traits['Math'] = 'Square'
    elif str(tokenId) == str(tokenId)[::-1]:
        traits['Math'] = 'Palindrome'
    else:
        traits['Math'] = None
    return traits

def draw_gradient(image: Image, start_color: str, end_color: str) -> Image:
    base = Image.new('RGB', (IMAGE_SIZE, IMAGE_SIZE), start_color)
    image.paste(base, (0, 0))
    top = Image.new('RGB', (IMAGE_SIZE, IMAGE_SIZE), end_color)
    mask = Image.new('L', (IMAGE_SIZE, IMAGE_SIZE))
    mask_data = []
    for y in range(IMAGE_SIZE):
        for x in range(IMAGE_SIZE):
            mask_data.append(int(255 * (y / IMAGE_SIZE)))
    mask.putdata(mask_data)
    image.paste(top, (0, 0), mask)
    return image

def draw_cube(image: Image, x: int, y: int) -> Image:
    width = 2
    smallGap = 2
    largeGap = 4.5
    lowerTopleft = ( (x-largeGap)*10, (y-smallGap)*10 )
    lowerBottomRight = ( (x+smallGap)*10, (y+largeGap)*10 )
    upperTopLeft = ((x-smallGap)*10, (y-largeGap)*10)
    upperBottomRight = ((x+largeGap)*10, (y+smallGap)*10)
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
    draw.rectangle((lowerTopleft[0], lowerTopleft[1], lowerBottomRight[0], lowerBottomRight[1]), outline=COLOR_CUBE, width=width)
    draw.rectangle((upperTopLeft[0], upperTopLeft[1], upperBottomRight[0], upperBottomRight[1]), outline=COLOR_CUBE, width=width)
    draw.line((lowerTopleft[0], lowerTopleft[1], upperTopLeft[0], upperTopLeft[1]), fill=COLOR_CUBE, width=width)
    draw.line((lowerBottomRight[0], lowerBottomRight[1], upperBottomRight[0], upperBottomRight[1]), fill=COLOR_CUBE, width=width)
    draw.line((lowerBottomRight[0], lowerTopleft[1], upperBottomRight[0], upperTopLeft[1]), fill=COLOR_CUBE, width=width)
    draw.line((upperTopLeft[0], upperBottomRight[1], lowerTopleft[0], lowerBottomRight[1]), fill=COLOR_CUBE, width=width)
    newImage = Image.alpha_composite(image, overlay)
    return newImage

def draw_grid(image: Image) -> Image:
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
    for row in range(1, GRID_COUNT):
      draw.line((0, row * GRID_SIZE, IMAGE_SIZE, row * GRID_SIZE), fill=COLOR_GRID, width=2)
    for col in range(1, GRID_COUNT):
      draw.line((col * GRID_SIZE, 0, col * GRID_SIZE, IMAGE_SIZE), fill=COLOR_GRID, width=2)
    newImage = Image.alpha_composite(image, overlay)
    return newImage

def generate_invalid_image(tokenId: int) -> Image:
    image = Image.new('RGBA', (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))
    return image

def generate_image(tokenId: int) -> Image:
    image = Image.new('RGBA', (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

    # good example colours: violet -> orange, cyan -> purple, blue -> pink, lime -> orange, yellow -> purple
    # #6CDCDC -> #C513C9 , #CC6CDC -> #C98013 , #97DC6C -> #C95513 , #DADC6C -> #7913C9 , #DC746C -> #C513C9 , #6CDCA6 -> #C91360 , #6C77DC -> #2DC913
    # image = draw_gradient(image=image, start_color="#6CDCDC", end_color="#C513C9")

    tokenIndex = tokenId - 1
    xCoord = tokenIndex % 100
    yCoord = int(tokenIndex / 100)

    # Draw grid
    image = draw_grid(image)

    # Draw Box at Token Number
    imageDraw = ImageDraw.Draw(image)
    imageDraw.rectangle((xCoord * 10, yCoord * 10, xCoord * 10 + 10, yCoord * 10 + 10), fill=WHITE)
    image = draw_cube(image=image, x=xCoord, y=yCoord)

    # Draw Text
    inTopLeftQuadrant = xCoord < 50 and yCoord < 50
    inTopRightQuadrant = xCoord >= 50 and yCoord < 50
    inBottomRightQuadrant = xCoord >= 50 and yCoord >= 50
    inBottomLeftQuadrant = xCoord < 50 and yCoord >= 50
    padding = 110
    title = "MDTP"
    subtitle = f'#{tokenId}'
    titleSize = imageDraw.textsize(text=title, font=FONT)
    subtitleSize = imageDraw.textsize(text=subtitle, font=FONT)
    imageDraw = ImageDraw.Draw(image)
    # if inTopLeftQuadrant or inBottomRightQuadrant:
      # imageDraw.multiline_text((550,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=FONT, fill=WHITE, spacing=-10)
      # imageDraw.multiline_text((80,700), f'TOKEN\n{tokenId}', font=FONT, fill=WHITE, align='center')
    # else:
      # imageDraw.multiline_text((80,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=FONT, fill=WHITE, spacing=-10)
      # imageDraw.multiline_text((640,700), f'TOKEN\n{tokenId}', font=FONT, fill=WHITE, align='center')
    xLeft = padding
    xRight = IMAGE_SIZE - padding
    yTop = -30 + padding
    yBottom = IMAGE_SIZE - padding
    if inTopLeftQuadrant:
      # draw in bottom right
      imageDraw.text((xRight - titleSize[0], yBottom - subtitleSize[1] - titleSize[1]), text=title, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
      imageDraw.text((xRight - subtitleSize[0], yBottom - subtitleSize[1]), text=subtitle, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
    elif inTopRightQuadrant:
      # draw in bottom left
      imageDraw.text((xLeft, yBottom - subtitleSize[1] - titleSize[1]), text=title, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
      imageDraw.text((xLeft, yBottom - subtitleSize[1]), text=subtitle, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
    elif inBottomLeftQuadrant:
      # draw in top right
      imageDraw.text((xRight - titleSize[0], yTop), text=title, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
      imageDraw.text((xRight - subtitleSize[0], yTop + titleSize[1]), text=subtitle, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
    elif inBottomRightQuadrant:
      # draw in top left
      imageDraw.text((xLeft, yTop), text=title, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
      imageDraw.text((xLeft, yTop + titleSize[1]), text=subtitle, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)

    return image

def generate_rounded_image(tokenId: int) -> Image:
    frameWidth = 120
    image = Image.new('RGBA', (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

    tokenIndex = tokenId - 1
    xCoord = int(tokenIndex % 100) * (IMAGE_SIZE / 100)
    yCoord = int(tokenIndex / 100) * (IMAGE_SIZE / 100)

    # Draw grid
    image = draw_grid(image)
    imageDraw = ImageDraw.Draw(image)

    # Draw Box at Token Number
    # print(xCoord, yCoord)
    # xSquare = ((xCoord / IMAGE_SIZE) * 2) - 1
    # ySquare = ((1 - (yCoord / IMAGE_SIZE)) * 2) - 1
    # print(xSquare, ySquare)
    # # xCircle = xSquare * math.sqrt(xSquare**2 + ySquare**2 - (xSquare**2 * ySquare**2)) / math.sqrt(xSquare**2 + ySquare**2)
    # # yCircle = ySquare * math.sqrt(xSquare**2 + ySquare**2 - (xSquare**2 * ySquare**2)) / math.sqrt(xSquare**2 + ySquare**2)
    # xCircle = ((xSquare * math.sqrt(1 - ySquare * ySquare / 2)) + 1) / 2.0
    # yCircle = ((ySquare * math.sqrt(1 - xSquare * xSquare / 2)) + 1) / 2.0
    # print(xCircle, yCircle)
    # width = 10
    # xPos = int(frameWidth + (xCircle * (IMAGE_SIZE - (frameWidth * 2.0))))
    # yPos = int(frameWidth + ((1 - yCircle) * (IMAGE_SIZE - (frameWidth * 2.0))))
    # print(xPos, yPos)
    # gridLineWidth = 2
    # boxSize = 20
    # gridSize = boxSize / 2
    # gridOpacity = 0.4
    # overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    # imageDraw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
    # imageDraw.rectangle((xPos, yPos, xPos + width, yPos + width), fill=WHITE)
    # xPos -= width / 2
    # yPos -= width / 2
    # grid2LineWidth = 2
    # grid2Size = boxSize
    # grid2Opacity = 0.1
    # # outergrid
    # imageDraw.rectangle((xPos, yPos-grid2Size, xPos + grid2LineWidth, yPos-grid2Size+grid2Size), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos+boxSize-grid2LineWidth, yPos-grid2Size, xPos+boxSize-grid2LineWidth + grid2LineWidth, yPos-grid2Size+grid2Size), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos, yPos+boxSize, xPos + grid2LineWidth, yPos+boxSize+grid2Size), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos+boxSize-grid2LineWidth, yPos+boxSize, xPos+boxSize-grid2LineWidth + grid2LineWidth, yPos+boxSize+grid2Size), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos-grid2Size, yPos, xPos-grid2Size + grid2Size, yPos+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos-grid2Size, yPos+boxSize-grid2LineWidth, xPos-grid2Size + grid2Size, yPos+boxSize-grid2LineWidth+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos+boxSize, yPos, xPos+boxSize + grid2Size, yPos+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos+boxSize, yPos+boxSize-grid2LineWidth, xPos+boxSize + grid2Size, yPos+boxSize-grid2LineWidth+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos-gridSize*2, yPos-gridSize-grid2LineWidth, xPos-gridSize*2 + boxSize*3, yPos-gridSize-grid2LineWidth+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos-gridSize*2, yPos+boxSize+gridSize, xPos-gridSize*2 + boxSize*3, yPos+boxSize+gridSize+grid2LineWidth), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos-gridSize-grid2LineWidth, yPos-gridSize*2, xPos-gridSize-grid2LineWidth + grid2LineWidth, yPos-gridSize*2+boxSize*3), fill=(25, 25, 25))
    # imageDraw.rectangle((xPos+boxSize+gridSize, yPos-gridSize*2, xPos+boxSize+gridSize + grid2LineWidth, yPos-gridSize*2+boxSize*3), fill=(25, 25, 25))
    # # main grid
    # imageDraw.rectangle((xPos, yPos-gridSize, xPos + gridLineWidth, yPos-gridSize + gridSize*2+boxSize), fill=(100, 100, 100))
    # imageDraw.rectangle((xPos+boxSize-gridLineWidth, yPos-gridSize, xPos+boxSize-gridLineWidth+gridLineWidth, yPos-gridSize+gridSize*2+boxSize), fill=(100, 100, 100))
    # imageDraw.rectangle((xPos-gridSize, yPos, xPos-gridSize+gridSize*2+boxSize, yPos+gridLineWidth), fill=(100, 100, 100))
    # imageDraw.rectangle((xPos-gridSize, yPos+boxSize-gridLineWidth, xPos-gridSize+gridSize*2+boxSize, yPos+boxSize-gridLineWidth+gridLineWidth), fill=(100, 100, 100))
    # image = Image.alpha_composite(image, overlay)

    # Draw Text
    title = "MDTP"
    subtitle = f'#{tokenId}'
    imageDraw = ImageDraw.Draw(image)
    titleSize = imageDraw.textsize(text=title, font=FONT)
    subtitleSize = imageDraw.textsize(text=subtitle, font=FONT)
    # titleTop = (IMAGE_SIZE * 3.0 / 4.0 - titleSize[1] - frameWidth / 2) if yCoord < 500 else (IMAGE_SIZE / 4.0 - titleSize[1] + frameWidth / 2)
    titleTop = IMAGE_SIZE / 2.0 - titleSize[1]
    imageDraw.text((IMAGE_SIZE / 2.0 - titleSize[0] / 2.0, titleTop), text=title, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)
    imageDraw.text((IMAGE_SIZE / 2.0 - subtitleSize[0] / 2.0, titleTop + titleSize[1]), text=subtitle, font=FONT, fill=WHITE, stroke_width=10, stroke_fill=BLACK)

    with Image.open(fp=f'./output/frames/{tokenId}.png') as tokenImage:
        frameImage = tokenImage.resize(size=(IMAGE_SIZE, IMAGE_SIZE))
    image.paste(frameImage, (0, 0), frameImage)

    return image


@click.command()
@click.option('-t', '--token-id', 'tokenId', required=False, type=int, default=None)
@click.option('-u', '--upload', 'shouldUpload', required=False, is_flag=True, default=False)
@click.option('-v', '--v1', 'shouldGenerateForV1', required=False, is_flag=True, default=False)
async def run(tokenId: Optional[int], shouldUpload: bool, shouldGenerateForV1: bool):
    tokenIds = [tokenId] if tokenId else list(range(1, 10000 + 1))
    # tokenIds = [5001, 711, 1, 100, 5050]

    infuraIpfsAuth = BasicAuthentication(username=os.environ['INFURA_IPFS_PROJECT_ID'], password=os.environ['INFURA_IPFS_PROJECT_SECRET'])
    ipfsRequester = Requester(headers={'authorization': f'Basic {infuraIpfsAuth.to_string()}'})
    ipfsManager = IpfsManager(requester=ipfsRequester)

    imagesOutputDirectory = 'output/images' if not shouldGenerateForV1 else 'output/images-v1'
    await file_util.create_directory(directory=imagesOutputDirectory)
    framesOutputDirectory = 'output/frames'
    metadataOutputDirectory = 'output/metadatas' if not shouldGenerateForV1 else 'output/metadatas-v1'
    await file_util.create_directory(directory=metadataOutputDirectory)

    for tokenId in tokenIds:
        isValid = not shouldGenerateForV1 or tokenId in VALID_TOKEN_IDS
        print(f'Generating image for {tokenId}')
        imagePath = os.path.join(imagesOutputDirectory, f'{tokenId}.png')
        imageUrl = imagePath
        if isValid:
            tokenImage = generate_rounded_image(tokenId=tokenId)
        else:
            tokenImage = generate_invalid_image(tokenId=tokenId)
        tokenImage.save(imagePath)
        if shouldUpload:
            print(f'Uploading image for {tokenId}')
            with open(imagePath, 'rb') as imageFile:
                cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
            imageUrl = f'ipfs://{cid}'
        framePath = os.path.join(framesOutputDirectory, f'{tokenId}.png')
        frameUrl = framePath
        if shouldUpload:
            print(f'Uploading frame for {tokenId}')
            with open(framePath, 'rb') as frameFile:
                cid = await ipfsManager.upload_file_to_ipfs(fileContent=frameFile)
            frameUrl = f'ipfs://{cid}'
        print(f'Generating metadata for {tokenId}')
        metadata = {
            "tokenId": tokenId,
            "tokenIndex": tokenId - 1,
            "name": f'MDTP #{tokenId}' if isValid else f'INVALID MDTP #{tokenId}',
            "description": (
                f"This an official TokenPage NFT! This NFT gives you special access in the TokenPage community. It also gives you full ownership of block {tokenId} on https://milliondollartokenpage.com/ (MDTP), a content-sharing space where you can show off your best work. Plus, it also gives you a gorgeous frame to display around your PFP and show off that you belong to the TokenPage community, set your frame now at https://pfpkit.xyz! "
                if isValid else
                f'DO NOT BUY THIS, DO NOT TRADE THIS. This token was part of MDTP v1 but was not claimed in time so is now useless.'
            ),
            "image": imageUrl,
            "frameImage": frameUrl if isValid else None,
            "url": f'https://milliondollartokenpage.com/tokens/{tokenId}',
            "attributes": [{'trait_type': key, 'value': value} for key, value in get_traits(tokenId=tokenId).items()] if isValid else []
        }
        with open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), "w") as metadataFile:
            metadataFile.write(json.dumps(metadata))
    if shouldUpload:
        print(f'Uploading metadata')
        fileContentMap = {f'{tokenId}.json': open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), 'r') for tokenId in tokenIds}
        print(len(fileContentMap))
        cid = await ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
        for openFile in fileContentMap.values():
            openFile.close()
        print(f'Uploaded metadata to ipfs://{cid}')
    await ipfsRequester.close_connections()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')

# py create_consolidated_metadata.py -d ./output/metadatas -o output/metadata_consolidated.json
# aws --profile kiba s3 sync ./output/images/ s3://mdtp-images/images/ --acl public-read
