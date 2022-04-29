import dataclasses
import math
import os
import random
import subprocess
from typing import Dict
from typing import List

import asyncclick as click
from colour import Color
from core import logging
from core.util import file_util

from frame_util import SVG
from frame_util import Delaunator


@dataclasses.dataclass
class ColorConfig:
    colorPoints: List[Dict]
    shouldUseHslMerging: bool


def distance_between_points(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.hypot(x1 - x2, y1 - y2)

def merge_colors(colors: List[str], factors: List[float], shouldUseHsl: bool = False) -> str:
    output = Color()
    for color, factor in zip(colors, factors):
        color = Color(color)
        if shouldUseHsl:
            output.hue += color.hue * factor
            output.saturation += color.saturation * factor
            output.luminance += color.luminance * factor
        else:
            output.red += color.red * factor
            output.green += color.green * factor
            output.blue += color.blue * factor
    return output.get_hex()

def angle_between_points(x1: float, y1: float, x2: float, y2: float) -> float:
    angleRadians = math.atan2(y2-y1, x2-x1)
    return angleRadians

def generate_svg(tokenId: int) -> str:
    tokenX = int((tokenId - 1) % 100)
    tokenY = int((tokenId - 1) / 100)
    print(tokenX, tokenY)
    if tokenX >= 37 and tokenX <= 61 and tokenY >= 40 and tokenY <= 59:
        colorConfigList = GOLD_COLOR_CONFIGS
    elif tokenX < 50 and tokenY < 50:
        colorConfigList = BLUE_COLOR_CONFIGS
    elif tokenX >= 50 and tokenY < 50:
        colorConfigList = DARKBLUE_COLOR_CONFIGS
    elif tokenX < 50 and tokenY >= 50:
        colorConfigList = PURPLE_COLOR_CONFIGS
    elif tokenX >= 50 and tokenY >= 50:
        colorConfigList = PINK_COLOR_CONFIGS

    random.seed(hash(tokenId))
    size = 1000
    width = 80
    outerDistance = size / 2.0
    innerDistance = outerDistance - width
    centerX = centerY = size / 2.0

    # White of the color options is chosen
    colorConfig = colorConfigList[random.randint(0, len(colorConfigList) - 1)]
    print(colorConfig)
    # How far a triangle can choose its color from 200 - 360
    colorJitterDistance = 200 + (random.randint(0, 4) * 40)
    print(colorJitterDistance)
    # How far a point can move from its intended position (only for inner points)
    pointJitterAngle = 1 / 100.0
    # How far a point can move from its intended position (only for inner points)
    pointJitterDistance = width / 7.0
    # DONT CHANGE: Number of points along each edge (inner and outer)
    edgePointCount = 100
    # DONT CHANGE: Number of points in between edges (on the 1/3 and 2/3) circles
    innerPointCount = 100

    svg = SVG()
    svg.width = size
    svg.height = size
    svg.append(f"""<mask id="ringmask">
        <rect x="0" y="0" width="{size}" height="{size}" fill="black" />
        <circle cx="{size / 2.0}" cy="{size / 2.0}" r="{(size - width) / 2.0}" stroke-width="{width}" stroke="white" fill="rgb(0, 0, 0)"/>
    </mask>""")
    svg.append(f"""<mask id="innermask">
        <rect x="0" y="0" width="{size}" height="{size}" fill="white" />
        <circle cx="{size / 2.0}" cy="{size / 2.0}" r="{(size - width) / 2.0}" fill="black"/>
    </mask>""")
    svg.rect(0, 0, size, size, **{ "fill": "black", "mask": "url(#innermask)" })

    # svg.append(f"""<circle cx="{size / 2.0}" cy="{size / 2.0}" r="{(size - width) / 2.0}" stroke-width="{width}" stroke="white" fill="rgb(0, 0, 0)" mask="url(#ringmask)"/>""")

    colorAngle = random.random() * math.pi * 2
    colorAngleX = math.cos(colorAngle)
    colorAngleY = math.sin(colorAngle)

    # Generate points
    points = []
    for i in range(edgePointCount):
        angle = i / edgePointCount * math.pi * 2
        x1 = (math.cos(angle) * innerDistance) + centerX
        y1 = (math.sin(angle) * innerDistance) + centerY
        points.append([x1, y1])
        x2 = (math.cos(angle) * outerDistance) + centerX
        y2 = (math.sin(angle) * outerDistance) + centerY
        points.append([x2, y2])
    for i in range(innerPointCount):
        angle1 = ((i / innerPointCount) + (random.random() - 0.5) * 2 * pointJitterAngle) * math.pi * 2
        distance1 = innerDistance + min(width, max(0, (width / 3.0) + (random.random() - 0.5) * 2 * pointJitterDistance))
        x1 = (math.cos(angle1) * distance1) + centerX
        y1 = (math.sin(angle1) * distance1) + centerY
        points.append([x1, y1])
        angle2 = ((i / innerPointCount) + (random.random() - 0.5) * 2 * pointJitterAngle) * math.pi * 2
        distance2 = innerDistance + min(width, max(0, (width / 1.5) + (random.random() - 0.5) * 2 * pointJitterDistance))
        x2 = (math.cos(angle2) * distance2) + centerX
        y2 = (math.sin(angle2) * distance2) + centerY
        points.append([x2, y2])

    # Draw triangles
    d = Delaunator(points)
    for i in range(0, len(d.triangles), 3):
        p1x = points[d.triangles[i + 0]][0]
        p1y = points[d.triangles[i + 0]][1]
        p2x = points[d.triangles[i + 1]][0]
        p2y = points[d.triangles[i + 1]][1]
        p3x = points[d.triangles[i + 2]][0]
        p3y = points[d.triangles[i + 2]][1]
        triangleCenterPointX = (p1x + p2x + p3x) / 3.0
        triangleCenterPointY = (p1y + p2y + p3y) / 3.0
        triangleCenterDistance = distance_between_points(x1=triangleCenterPointX, x2=centerX, y1=triangleCenterPointY, y2=centerY)
        # NOTE(krishan711): cairo doesn't render masks properly: https://github.com/Kozea/CairoSVG/issues/214
        if triangleCenterDistance < innerDistance + 1 or triangleCenterDistance > outerDistance - 1:
            continue
        triangleCenterPointX += (random.random() - 0.5) * 2 * colorJitterDistance
        triangleCenterPointY += (random.random() - 0.5) * 2 * colorJitterDistance
        colorDistances = [1.0 / distance_between_points(x1=triangleCenterPointX, y1=triangleCenterPointY, x2=centerX + (colorAngleX * outerDistance * colorPoint['x']), y2=centerY + (colorAngleY * outerDistance * colorPoint['y'])) for colorPoint in colorConfig.colorPoints]
        colorDistanceSum = sum(colorDistances)
        colorFactors = [(colorDistance / colorDistanceSum) for colorDistance in colorDistances]
        color = merge_colors(colors=[colorPoint['color'] for colorPoint in colorConfig.colorPoints], factors=colorFactors, shouldUseHsl=colorConfig.shouldUseHslMerging)
        svg.polygon(f'{p1x},{p1y} {p2x},{p2y} {p3x},{p3y}', **{
            'opacity': 1,
            'fill': color,
            'stroke': color,
            'mask': "url(#ringmask)",
        })

    tokenIndex = tokenId - 1
    xCoord = size * ((tokenIndex % 100) / 100)
    yCoord = size * (int(tokenIndex / 100) / 100)

    # Draw a dot on the ring representing the token
    starColor = '#ffffff'
    boxSize = 24
    angle = angle_between_points(centerX, centerY, xCoord, yCoord)
    xCoord = (math.cos(angle) * (innerDistance + ((outerDistance - innerDistance) / 2.0))) + centerX
    yCoord = (math.sin(angle) * (innerDistance + ((outerDistance - innerDistance) / 2.0))) + centerY
    boxTopLeftX = xCoord-boxSize/2
    boxTopLeftY = yCoord-boxSize/2
    svg.rect(x=boxTopLeftX+boxSize/3, y=boxTopLeftY+boxSize/3, height=boxSize/3, width=boxSize/3, **{'fill': starColor, 'opacity': 1})
    svg.rect(x=boxTopLeftX, y=boxTopLeftY, height=boxSize, width=boxSize, **{'fill': starColor, 'opacity': 0.3})
    # grid
    gridLineWidth = 2
    gridSize = boxSize / 2
    gridOpacity = 0.4
    # svg.rect(x=boxTopLeftX, y=boxTopLeftY-gridSize, height=gridSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX+boxSize-gridLineWidth, y=boxTopLeftY-gridSize, height=gridSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX, y=boxTopLeftY+boxSize, height=gridSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX+boxSize-gridLineWidth, y=boxTopLeftY+boxSize, height=gridSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX-gridSize, y=boxTopLeftY, height=gridLineWidth, width=gridSize, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX-gridSize, y=boxTopLeftY+boxSize-gridLineWidth, height=gridLineWidth, width=gridSize, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX+boxSize, y=boxTopLeftY, height=gridLineWidth, width=gridSize, **{'fill': starColor, 'opacity': gridOpacity})
    # svg.rect(x=boxTopLeftX+boxSize, y=boxTopLeftY+boxSize-gridLineWidth, height=gridLineWidth, width=gridSize, **{'fill': starColor, 'opacity': gridOpacity})
    svg.rect(x=boxTopLeftX, y=boxTopLeftY-gridSize, height=gridSize*2+boxSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    svg.rect(x=boxTopLeftX+boxSize-gridLineWidth, y=boxTopLeftY-gridSize, height=gridSize*2+boxSize, width=gridLineWidth, **{'fill': starColor, 'opacity': gridOpacity})
    svg.rect(x=boxTopLeftX-gridSize, y=boxTopLeftY, height=gridLineWidth, width=gridSize*2+boxSize, **{'fill': starColor, 'opacity': gridOpacity})
    svg.rect(x=boxTopLeftX-gridSize, y=boxTopLeftY+boxSize-gridLineWidth, height=gridLineWidth, width=gridSize*2+boxSize, **{'fill': starColor, 'opacity': gridOpacity})

    # outer grid
    grid2LineWidth = 2
    grid2Size = boxSize
    grid2Opacity = 0.1
    svg.rect(x=boxTopLeftX, y=boxTopLeftY-grid2Size, height=grid2Size, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX+boxSize-grid2LineWidth, y=boxTopLeftY-grid2Size, height=grid2Size, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX, y=boxTopLeftY+boxSize, height=grid2Size, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX+boxSize-grid2LineWidth, y=boxTopLeftY+boxSize, height=grid2Size, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX-grid2Size, y=boxTopLeftY, height=grid2LineWidth, width=grid2Size, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX-grid2Size, y=boxTopLeftY+boxSize-grid2LineWidth, height=grid2LineWidth, width=grid2Size, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX+boxSize, y=boxTopLeftY, height=grid2LineWidth, width=grid2Size, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX+boxSize, y=boxTopLeftY+boxSize-grid2LineWidth, height=grid2LineWidth, width=grid2Size, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX-gridSize*2, y=boxTopLeftY-gridSize-grid2LineWidth, height=grid2LineWidth, width=boxSize*3, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX-gridSize*2, y=boxTopLeftY+boxSize+gridSize, height=grid2LineWidth, width=boxSize*3, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX-gridSize-grid2LineWidth, y=boxTopLeftY-gridSize*2, height=boxSize*3, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    svg.rect(x=boxTopLeftX+boxSize+gridSize, y=boxTopLeftY-gridSize*2, height=boxSize*3, width=grid2LineWidth, **{'fill': starColor, 'opacity': grid2Opacity})
    # shadow boxes
    # firstShadowOffset = 3
    # svg.rect(x=boxTopLeftX-firstShadowOffset, y=boxTopLeftY-firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    # svg.rect(x=boxTopLeftX-firstShadowOffset, y=boxTopLeftY+boxSize/2+firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    # svg.rect(x=boxTopLeftX+boxSize/2+firstShadowOffset, y=boxTopLeftY-firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    # svg.rect(x=boxTopLeftX+boxSize/2+firstShadowOffset, y=boxTopLeftY+boxSize/2+firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    # secondShadowOffset = 6
    # svg.rect(x=boxTopLeftX-secondShadowOffset, y=boxTopLeftY-secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    # svg.rect(x=boxTopLeftX-secondShadowOffset, y=boxTopLeftY+boxSize/2+secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    # svg.rect(x=boxTopLeftX+boxSize/2+secondShadowOffset, y=boxTopLeftY-secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    # svg.rect(x=boxTopLeftX+boxSize/2+secondShadowOffset, y=boxTopLeftY+boxSize/2+secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})

    # Add logo
    # logoWidth = 74
    # logoHeight = 32
    # svg.append(f"""
    #     <svg x="{(size - logoWidth) / 2.0}" y="{size - logoHeight - 5}" width="74" height="32" viewBox="0 0 74 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    #         <path opacity="0.7" fill="white" d="M25.4687 25V22.5977L27.2617 22.1641V10.7969L25.4687 10.3516V7.9375H27.2617H33.4609C35 7.9375 36.3633 8.29687 37.5508 9.01562C38.7383 9.72656 39.668 10.7148 40.3398 11.9805C41.0117 13.2383 41.3477 14.6914 41.3477 16.3398V16.6094C41.3477 18.2578 41.0117 19.7148 40.3398 20.9805C39.668 22.2383 38.7383 23.2227 37.5508 23.9336C36.3633 24.6445 35 25 33.4609 25H25.4687ZM31.375 21.8828H33.25C34.1172 21.8828 34.8437 21.6641 35.4297 21.2266C36.0156 20.7891 36.457 20.1758 36.7539 19.3867C37.0586 18.5898 37.2109 17.6641 37.2109 16.6094V16.3281C37.2109 15.2734 37.0586 14.3516 36.7539 13.5625C36.457 12.7734 36.0156 12.1602 35.4297 11.7227C34.8437 11.2852 34.1172 11.0664 33.25 11.0664H31.375V21.8828Z"/>
    #         <path opacity="0.7" fill="white" d="M0.375 25V22.5977L2.13281 22.2227V10.7266L0.375 10.3516V7.9375H2.13281H8.42578L12.5508 19.1758H12.6211L16.6289 7.9375H24.5859V10.3516L22.8164 10.7266V22.2227L24.5859 22.5977V25H16.9453V22.5977L18.7852 22.2227V19.9961L18.8789 11.9687L18.8086 11.957L13.9805 25H10.7461L5.84766 12.1094L5.76562 12.1211L6.04687 19.4336V22.2227L8.02734 22.5977V25H0.375Z"/>
    #         <path opacity="0.7" fill="white" d="M46.2305 25V22.5977L48.0117 22.2227V11.125H45.375L45.2695 12.9648H42.1641V7.9375H58.0195V12.9648H54.8789L54.7852 11.125H52.125V22.2227L53.9062 22.5977V25H46.2305Z"/>
    #         <path opacity="0.7" fill="white" d="M58.4688 25V22.5977L60.2383 22.2227V10.7266L58.4688 10.3516V7.9375H60.2383H66.7656C68.125 7.9375 69.3047 8.17578 70.3047 8.65234C71.3047 9.12891 72.0742 9.79297 72.6133 10.6445C73.1602 11.4883 73.4336 12.4727 73.4336 13.5977C73.4336 14.7227 73.1602 15.707 72.6133 16.5508C72.0742 17.3945 71.3047 18.0508 70.3047 18.5195C69.3047 18.9883 68.125 19.2227 66.7656 19.2227H64.3516V22.2227L66.1211 22.5977V25H58.4688ZM64.3516 16.0703H66.7656C67.6016 16.0703 68.2344 15.8438 68.6641 15.3906C69.1016 14.9297 69.3203 14.3398 69.3203 13.6211C69.3203 12.8789 69.1016 12.2695 68.6641 11.793C68.2344 11.3164 67.6016 11.0781 66.7656 11.0781H64.3516V16.0703Z"/>
    #     </svg>
    # """)

    # bigger logo
    # logoWidth = 173
    # logoHeight = 47
    # svg.append(f"""
    #     <svg x="{(size - logoWidth) / 2.0}" y="{size - logoHeight - (width / 2) + (width - logoHeight) / 2}" width="173" height="47" viewBox="0 0 173 47" fill="none" xmlns="http://www.w3.org/2000/svg">
    #         <path fill="white" fill-opacity="0.2" d="M0 37.3162L0.87288 32.0622L4.91679 31.8704L9.09384 6.72811L5.32244 5.27962L6.19958 0L24.0966 2.87785L29.1832 28.9308L29.3395 28.9559L42.3323 5.81016L60.021 8.6545L59.1438 13.9341L55.0739 14.1217L50.8968 39.264L54.6943 40.7167L53.8214 45.9707L36.8361 43.2394L37.709 37.9854L41.9353 37.823L42.7443 32.9534L45.8694 15.4309L45.7173 15.3801L30.2452 42.1796L23.0551 41.0234L16.8496 11.0803L16.663 11.0766L14.6312 27.1698L13.6178 33.2695L17.8842 34.7976L17.0113 40.0516L0 37.3162Z"/>
    #         <path fill="white" fill-opacity="0.2" d="M61.537 46.3501L61.7313 41.0298L65.8024 40.2122L66.7217 15.0382L62.7216 13.9094L62.9169 8.56314L80.9078 9.19903C84.3723 9.32148 87.4121 10.2258 90.0271 11.9121C92.6428 13.581 94.6556 15.8436 96.0657 18.7C97.4764 21.539 98.1151 24.7838 97.9818 28.4345L97.96 29.0314C97.8267 32.6821 96.9526 35.8821 95.3379 38.6315C93.7237 41.3637 91.5513 43.4697 88.8207 44.9497C86.09 46.4297 82.9925 47.1084 79.5279 46.986L61.537 46.3501ZM75.0844 39.9166L79.3052 40.0658C81.2573 40.1348 82.9105 39.7082 84.2649 38.7859C85.6192 37.8636 86.6625 36.5405 87.3946 34.8167C88.1449 33.0762 88.5627 31.038 88.648 28.7023L88.6707 28.0794C88.756 25.7437 88.4876 23.69 87.8656 21.9183C87.2611 20.1472 86.3171 18.7539 85.0335 17.7383C83.7499 16.7228 82.132 16.1806 80.1799 16.1116L75.9592 15.9624L75.0844 39.9166Z"/>
    #         <path fill="white" fill-opacity="0.2" d="M111.407 46.5488L110.972 41.2423L114.904 40.0969L112.896 15.5835L106.976 16.0527L107.072 20.1355L100.1 20.6882L99.1902 9.58338L134.79 6.76143L135.699 17.8663L128.648 18.4252L128.104 14.3779L122.132 14.8514L124.139 39.3649L128.206 39.8762L128.641 45.1827L111.407 46.5488Z"/>
    #         <path fill="white" fill-opacity="0.2" d="M144.518 43.5417L143.491 38.3147L147.244 36.7545L142.329 11.7417L138.255 11.6701L137.223 6.4177L155.572 2.92786C158.579 2.35608 161.29 2.37832 163.705 2.99459C166.12 3.61086 168.106 4.73202 169.662 6.35807C171.232 7.96385 172.258 9.9906 172.739 12.4383C173.22 14.8861 173.036 17.1429 172.187 19.2087C171.356 21.2712 169.935 23.0227 167.924 24.4633C165.912 25.9038 163.404 26.9099 160.397 27.4817L155.058 28.4971L156.341 35.0244L160.415 35.096L161.442 40.3229L144.518 43.5417ZM153.711 21.6383L159.05 20.6229C160.898 20.2713 162.201 19.5122 162.957 18.3456C163.728 17.1587 163.96 15.7833 163.652 14.2195C163.335 12.6046 162.591 11.3708 161.419 10.5179C160.265 9.66177 158.764 9.4095 156.915 9.76112L151.576 10.7765L153.711 21.6383Z"/>
    #         <path stroke="white" stroke-opacity="0.15" d="M29.7755 29.2007L42.5975 6.35922L59.4453 9.06837L58.7169 13.4533L55.0508 13.6222L54.6469 13.6409L54.5806 14.0398L50.4036 39.182L50.3366 39.585L50.7182 39.731L54.1341 41.0377L53.4097 45.398L37.4117 42.8256L38.1354 38.4694L41.9545 38.3226L42.3617 38.3069L42.4285 37.9049L43.2365 33.0412L43.2375 33.0354L46.3616 15.5187L46.4375 15.0934L46.0277 14.9566L45.8757 14.9059L45.4884 14.7766L45.2843 15.1301L29.9845 41.6312L23.4748 40.5845L17.3392 10.9788L17.2582 10.5883L16.8595 10.5804L16.6728 10.5767L16.2232 10.5678L16.1669 11.014L14.1364 27.0974L13.1246 33.1876L13.0562 33.5994L13.4492 33.7402L17.3225 35.1275L16.5996 39.479L0.575611 36.9023L1.29994 32.5425L4.94047 32.3698L5.34384 32.3507L5.41002 31.9523L9.58708 6.81005L9.65393 6.40762L9.2731 6.26135L5.88254 4.95913L6.6113 0.572627L23.6727 3.31612L28.6925 29.0266L28.7593 29.3691L29.1038 29.4245L29.2601 29.4496L29.6047 29.505L29.7755 29.2007ZM65.9009 40.7024L66.2877 40.6247L66.3021 40.2305L67.2214 15.0565L67.2357 14.6637L66.8575 14.557L63.2357 13.5349L63.3983 9.08047L80.8902 9.69871C84.2752 9.81836 87.2253 10.7003 89.7562 12.3323L89.7582 12.3336C92.2947 13.9521 94.2466 16.1445 95.6174 18.9213L95.6179 18.9225C96.9862 21.6761 97.6129 24.8361 97.4821 28.4163L97.4603 29.0132C97.3296 32.5932 96.4738 35.7102 94.9067 38.3783C93.3377 41.0336 91.2312 43.0745 88.5824 44.5101C85.939 45.9428 82.9316 46.606 79.5456 46.4863L62.0549 45.8681L62.2165 41.4423L65.9009 40.7024ZM74.5848 39.8984L74.5665 40.3986L75.0668 40.4163L79.2875 40.5655C81.325 40.6375 83.0881 40.1922 84.5463 39.1992C85.9906 38.2156 87.0905 36.8116 87.8545 35.0127C88.6338 33.2042 89.0606 31.1034 89.1477 28.7205L89.1704 28.0977C89.2574 25.7152 88.9847 23.5976 88.3382 21.7549C87.7072 19.9071 86.7126 18.4292 85.3437 17.3462C83.9613 16.2526 82.235 15.6839 80.1976 15.6119L75.9769 15.4627L75.4777 15.4451L75.4595 15.9441L74.5848 39.8984ZM100.557 20.1504L99.7294 10.0422L134.332 7.29928L135.16 17.4075L129.08 17.8894L128.6 14.3114L128.537 13.8421L128.065 13.8795L122.092 14.3529L121.592 14.3926L121.633 14.8922L123.641 39.4057L123.674 39.8103L124.077 39.861L127.741 40.3216L128.102 44.7239L111.865 46.011L111.504 41.6082L115.044 40.577L115.436 40.4628L115.402 40.0561L113.395 15.5426L113.354 15.0456L112.857 15.085L106.937 15.5543L106.465 15.5917L106.476 16.0645L106.561 19.6745L100.557 20.1504ZM138.668 11.1773L137.811 6.8149L155.666 3.41906C158.616 2.85791 161.251 2.88455 163.581 3.47907C165.916 4.07478 167.816 5.15242 169.301 6.70381L169.305 6.70765C170.799 8.23621 171.784 10.1716 172.248 12.5347C172.713 14.898 172.532 17.0539 171.725 19.0187L171.724 19.0217C170.932 20.9865 169.575 22.6651 167.632 24.0568C165.692 25.4462 163.255 26.4291 160.304 26.9905L154.965 28.0059L154.471 28.0999L154.568 28.5935L155.85 35.1208L155.928 35.5172L156.332 35.5243L160.002 35.5888L160.854 39.9257L144.913 42.9576L144.061 38.6195L147.436 37.2162L147.814 37.0593L147.735 36.6581L142.82 11.6453L142.742 11.2489L142.338 11.2418L138.668 11.1773ZM153.22 21.7347L153.316 22.2224L153.804 22.1295L159.143 21.1141C161.077 20.7464 162.523 19.9348 163.377 18.6178C164.227 17.3079 164.472 15.7969 164.143 14.1231C163.805 12.4036 163.002 11.0524 161.716 10.1153C160.418 9.15305 158.762 8.90086 156.822 9.26992L151.483 10.2853L150.989 10.3793L151.086 10.8729L153.22 21.7347Z"/>
    #     </svg>
    # """)

    # branded bottom
    angleStart = math.pi / 2
    blocks = 4
    angleWidth = 7 * 2 * math.pi / 360
    blockStart = angleStart + 2 * angleWidth
    blockSegments = 10
    angleFragmentWidth = angleWidth / blockSegments
    colors = ['#4CC9F0', '#3F37C9', '#560BAD', '#F72585']
    BRAND_EDGE_BUFFER = 20
    allTopPoints = []
    allBottomPoints = []
    for i in range(blocks):
        topPoints = []
        bottomPoints = []
        for angleFraction in range(0, blockSegments + 1):
            angle = blockStart - (i * angleWidth) - (angleFraction * angleFragmentWidth)
            x = (math.cos(angle) * (innerDistance + BRAND_EDGE_BUFFER)) + centerX
            y = (math.sin(angle) * (innerDistance + BRAND_EDGE_BUFFER)) + centerY
            # half height
            # x = (math.cos(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerX
            # y = (math.sin(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerY
            # full height
            # x = (math.cos(angle) * (innerDistance + 0)) + centerX
            # y = (math.sin(angle) * (innerDistance + 0)) + centerY
            topPoints.append((x, y))
            x = (math.cos(angle) * (outerDistance - BRAND_EDGE_BUFFER)) + centerX
            y = (math.sin(angle) * (outerDistance - BRAND_EDGE_BUFFER)) + centerY
            bottomPoints.append((x, y))
        allTopPoints += topPoints
        allBottomPoints += bottomPoints
        # topString = ' '.join(f'{x},{y}' for x, y in topPoints)
        # bottomString = ' '.join(f'{x},{y}' for x, y in reversed(bottomPoints))
        # svg.polygon(f'{topString} {bottomString}', **{
        #     'fill': colors[i],
        #     'fill-opacity': '1',
        #     'mask': "url(#ringmask)",
        # })
    allTopString = ' '.join(f'{x},{y}' for x, y in allTopPoints)
    allBottomString = ' '.join(f'{x},{y}' for x, y in reversed(allBottomPoints))
    svg.polygon(f'{allTopString} {allBottomString}', **{
        'fill-opacity': '0',
        'stroke': '#000000',
        'stroke-width': '10',
        'stroke-linecap': "round",
        'stroke-opacity': "0.25",
        'mask': "url(#ringmask)",
    })
    # Post the blocks on top of the grey border
    for i in range(blocks):
        topPoints = []
        bottomPoints = []
        for angleFraction in range(0, blockSegments + 1):
            angle = blockStart - (i * angleWidth) - (angleFraction * angleFragmentWidth)
            x = (math.cos(angle) * (innerDistance + BRAND_EDGE_BUFFER)) + centerX
            y = (math.sin(angle) * (innerDistance + BRAND_EDGE_BUFFER)) + centerY
            # half height
            # x = (math.cos(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerX
            # y = (math.sin(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerY
            # full height
            # x = (math.cos(angle) * (innerDistance + 0)) + centerX
            # y = (math.sin(angle) * (innerDistance + 0)) + centerY
            topPoints.append((x, y))
            x = (math.cos(angle) * (outerDistance - BRAND_EDGE_BUFFER)) + centerX
            y = (math.sin(angle) * (outerDistance - BRAND_EDGE_BUFFER)) + centerY
            bottomPoints.append((x, y))
        allTopPoints += topPoints
        allBottomPoints += bottomPoints
        topString = ' '.join(f'{x},{y}' for x, y in topPoints)
        bottomString = ' '.join(f'{x},{y}' for x, y in reversed(bottomPoints))
        svg.polygon(f'{topString} {bottomString}', **{
            'fill': colors[i],
            'fill-opacity': '1',
            'mask': "url(#ringmask)",
        })
    # branded around
    # angleStart = math.pi / 2
    # blocks = 4
    # angleWidth = 10 * 2 * math.pi / 360
    # blockSegments = 10
    # angleFragmentWidth = angleWidth / blockSegments
    # colors = ['#4CC9F0', '#3F37C9', '#560BAD', '#F72585']
    # for i in range(blocks):
    #     blockStart = angleStart - angleWidth / 2.0 + (i * math.pi * 2 / 4.0)
    #     topPoints = []
    #     bottomPoints = []
    #     for angleFraction in range(0, blockSegments + 1):
    #         angle = blockStart + (angleFraction * angleFragmentWidth)
    #         x = (math.cos(angle) * innerDistance) + centerX
    #         y = (math.sin(angle) * innerDistance) + centerY
    #         # x = (math.cos(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerX
    #         # y = (math.sin(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerY
    #         topPoints.append((x, y))
    #         x = (math.cos(angle) * outerDistance) + centerX
    #         y = (math.sin(angle) * outerDistance) + centerY
    #         bottomPoints.append((x, y))
    #     topString = ' '.join(f'{x},{y}' for x, y in topPoints)
    #     bottomString = ' '.join(f'{x},{y}' for x, y in reversed(bottomPoints))
    #     svg.polygon(f'{topString} {bottomString}', **{
    #         'opacity': 1,
    #         'fill': colors[i],
    #         'opacity': '0.95',
    #         'mask': "url(#ringmask)",
    #     })
    return svg.to_string()


def generate_default_points(color1: str, color2: str) -> List[Dict]:
    return [
        {"x": -1, "y": -1, "color": color1},
        {"x": -1, "y": 1, "color": color1},
        {"x": 1, "y": -1, "color": color1},
        {"x": 0.3, "y": 0.3, "color": color2},
        {"x": 1, "y": 1, "color": color2},
    ]

BLUE_COLOR_CONFIGS = [
    # darker blue
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#5C77F2"), shouldUseHslMerging=False),
    # light grey
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#6C6C89"), shouldUseHslMerging=False),
    # light pink
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#8A6D88"), shouldUseHslMerging=False),
    # dark green
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#1C493F"), shouldUseHslMerging=False),
    # dark purple
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#27132C"), shouldUseHslMerging=False),
    # black
    ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#000000"), shouldUseHslMerging=False),
]
DARKBLUE_COLOR_CONFIGS = [
    # light pink
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#B96AC9"), shouldUseHslMerging=False),
    # light grey
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#A3A3B7"), shouldUseHslMerging=False),
    # light green
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#1CD9B6"), shouldUseHslMerging=False),
    # dark green
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#292E1E"), shouldUseHslMerging=False),
    # dark red
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#3B1717"), shouldUseHslMerging=False),
    # black
    ColorConfig(colorPoints=generate_default_points("#4361EE", "#000000"), shouldUseHslMerging=False),
]
PURPLE_COLOR_CONFIGS = [
    # light pink
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#D5B0AC"), shouldUseHslMerging=False),
    # light green
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#A9DDD6"), shouldUseHslMerging=False),
    # light grey
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#A3A3B7"), shouldUseHslMerging=False),
    # light blue
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#8ADEE1"), shouldUseHslMerging=False),
    # dark red
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#3D0814"), shouldUseHslMerging=False),
    # black
    ColorConfig(colorPoints=generate_default_points("#7209B7", "#000000"), shouldUseHslMerging=False),
]
PINK_COLOR_CONFIGS = [
    # light orange
    ColorConfig(colorPoints=generate_default_points("#F72585", "#FFD885"), shouldUseHslMerging=False),
    # light green
    ColorConfig(colorPoints=generate_default_points("#F72585", "#A9DEC1"), shouldUseHslMerging=False),
    # light blue
    ColorConfig(colorPoints=generate_default_points("#F72585", "#B9CDFC"), shouldUseHslMerging=False),
    # dark red
    ColorConfig(colorPoints=generate_default_points("#F72585", "#5F0000"), shouldUseHslMerging=False),
    # dark blue
    ColorConfig(colorPoints=generate_default_points("#F72585", "#021934"), shouldUseHslMerging=False),
    # black
    ColorConfig(colorPoints=generate_default_points("#F72585", "#000000"), shouldUseHslMerging=False),
]
GOLD_COLOR_CONFIGS = [
    # light pink
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#D35194"), shouldUseHslMerging=False),
    # light orange
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#F57D51"), shouldUseHslMerging=False),
    # light green
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#7DA216"), shouldUseHslMerging=False),
    # dark gold
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#655B1E"), shouldUseHslMerging=False),
    # dark brown
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#52414C"), shouldUseHslMerging=False),
    # black
    ColorConfig(colorPoints=generate_default_points("#FFD700", "#000000"), shouldUseHslMerging=False),
]

@click.command()
async def run():
    outputDirectory = os.path.join('output', 'frames')
    await file_util.create_directory(directory=outputDirectory)
    # for tokenId in range(1, 10000 + 1):
    for tokenId in range(7910, 10000 + 1):
    # for tokenId in [5037]:
        print(f'Generating {tokenId}')
        patternSvg = generate_svg(tokenId)
        with open(os.path.join(outputDirectory, f"{tokenId}.svg"), 'w') as output:
            output.write(patternSvg)
        subprocess.check_output(f'inkscape -w 1024 -h 1024 {outputDirectory}/{tokenId}.svg -o {outputDirectory}/{tokenId}.png', stderr=subprocess.STDOUT, shell=True)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
