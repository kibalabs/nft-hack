import dataclasses
import logging
import math
import os
import random
from typing import Dict
from typing import List
import subprocess

import asyncclick as click
from colour import Color

from frame_util import Delaunator


@dataclasses.dataclass
class ColorConfig:
    colorPoints: List[Dict]
    shouldUseHslMerging: bool


def generate_default_points(color1: str, color2: str) -> List[Dict]:
    return [
        {"x": -1, "y": -1, "color": color1},
        {"x": -1, "y": 1, "color": color1},
        {"x": 1, "y": -1, "color": color1},
        # {"x": 0.5, "y": 0.5, "color": color2},
        {"x": 0.85, "y": 0.85, "color": color2},
    ]


class SVG(object):
    def __init__(self):
        self._width = 100
        self._height = 100
        self.svg_string = ''

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        self._height = math.floor(value)

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        self._width = math.floor(value)

    @property
    def svg_header(self):
        return '<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'.format(**{
            'width': self.width, 'height': self.height
        })

    @property
    def svg_closer(self):
        return '</svg>'

    def to_string(self):
        return ''.join([self.svg_header, self.svg_string, self.svg_closer])

    def append(self, value):
        self.svg_string += value

    def rect(self, x, y, width, height, **kwargs):
        self.svg_string += '<rect x="{x}" y="{y}" width="{width}" height="{height}" {kwargs}/>'.format(**{
            'x': x, 'y': y, 'width': width, 'height': height, 'kwargs': self.write_args(**kwargs)
        })

    def circle(self, cx, cy, r, **kwargs):
        self.svg_string += '<circle cx="{cx}" cy="{cy}" r="{r}" {kwargs}/>'.format(**{
            'cx': cx, 'cy': cy, 'r': r, 'kwargs': self.write_args(**kwargs)
        })

    def path(self, str, **kwargs):
        self.svg_string += '<path d="{str}" {kwargs}/>'.format(**{
            'str': str, 'kwargs': self.write_args(**kwargs)
        })

    def polyline(self, str, **kwargs):
        self.svg_string += '<polyline points="{str}" {kwargs}/>'.format(**{
            'str': str, 'kwargs': self.write_args(**kwargs)
        })

    def polygon(self, str, **kwargs):
        self.svg_string += '<polygon points="{str}" {kwargs}/>'.format(**{
            'str': str, 'kwargs': self.write_args(**kwargs)
        })

    def group(self, elements, **kwargs):
        self.svg_string += '<g {}>'.format(self.write_args(**kwargs))
        for element in elements:
            exec(element)
        self.svg_string += '</g>'

    def write_args(self, **kwargs):
        str = ''
        for key, value in kwargs.items():
            if isinstance(value, dict):
                str += '{}="'.format(key)
                for key, value in value.items():
                    str += '{}:{};'.format(key, value)
                str += '" '
            else:
                str += '{}="{}" '.format(key, value)
        return str

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

def generate_svg(tokenId: int, colorConfig: ColorConfig) -> str:
    random.seed(hash(tokenId))
    size = 1000
    width = 80
    outerDistance = size / 2.0
    innerDistance = outerDistance - width
    centerX = centerY = size / 2.0

    # How far a triangle can choose its color from
    colorJitterDistance = 200
    # How far a point can move from its intended position (only for inner points)
    pointJitterAngle = 1 / 100.0
    # How far a point can move from its intended position (only for inner points)
    pointJitterDistance = width / 7.0
    # DONT CHANGE: Number of points along each edge (inner and outer)
    edgePointCount = 100
    # Number of points in between edges (on the 1/3 and 2/3) circles
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
    angleWidth =  10 * 2 * math.pi / 360
    blockStart = angleStart + 2 * angleWidth
    blockSegments = 10
    angleFragmentWidth = angleWidth / blockSegments
    colors = ['#4CC9F0', '#3F37C9', '#560BAD', '#F72585']
    for i in range(blocks):
        topPoints = []
        bottomPoints = []
        for angleFraction in range(0, blockSegments + 1):
            angle = blockStart - (i * angleWidth) - (angleFraction * angleFragmentWidth)
            x = (math.cos(angle) * innerDistance) + centerX
            y = (math.sin(angle) * innerDistance) + centerY
            # x = (math.cos(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerX
            # y = (math.sin(angle) * (innerDistance + (outerDistance - innerDistance) / 2)) + centerY
            topPoints.append((x, y))
            x = (math.cos(angle) * outerDistance) + centerX
            y = (math.sin(angle) * outerDistance) + centerY
            bottomPoints.append((x, y))
        topString = ' '.join(f'{x},{y}' for x, y in topPoints)
        bottomString = ' '.join(f'{x},{y}' for x, y in reversed(bottomPoints))
        svg.polygon(f'{topString} {bottomString}', **{
            'opacity': 1,
            'fill': colors[i],
            'opacity': '0.95',
            'mask': "url(#ringmask)",
        })

    # branded around
    # angleStart = math.pi / 2
    # blocks = 4
    # angleWidth =  10 * 2 * math.pi / 360
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

@click.command()
async def run():
    # red: c31432
    BLUE_COLOR_CONFIGS = [
        # black
        ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#000000"), shouldUseHslMerging=False),
        # dark red
        ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#5F0000"), shouldUseHslMerging=False),
        # dark green
        ColorConfig(colorPoints=generate_default_points("#4CC9F0", "#005F11"), shouldUseHslMerging=False),
    ]
    PURPLE_COLOR_CONFIGS = [
        # black
        ColorConfig(colorPoints=generate_default_points("#4361EE", "#000000"), shouldUseHslMerging=False),
        # dark red
        ColorConfig(colorPoints=generate_default_points("#4361EE", "#5F0000"), shouldUseHslMerging=False),
        # dark green
        ColorConfig(colorPoints=generate_default_points("#4361EE", "#005F11"), shouldUseHslMerging=False),
    ]
    LAVENDER_COLOR_CONFIGS = [
        # black
        ColorConfig(colorPoints=generate_default_points("#7209B7", "#000000"), shouldUseHslMerging=False),
        # dark red
        ColorConfig(colorPoints=generate_default_points("#7209B7", "#5F0000"), shouldUseHslMerging=False),
        # dark green
        ColorConfig(colorPoints=generate_default_points("#7209B7", "#005F11"), shouldUseHslMerging=False),
    ]
    PINK_COLOR_CONFIGS = [
        # black
        ColorConfig(colorPoints=generate_default_points("#F72585", "#000000"), shouldUseHslMerging=False),
        # dark red
        ColorConfig(colorPoints=generate_default_points("#F72585", "#5F0000"), shouldUseHslMerging=False),
        # dark blue
        ColorConfig(colorPoints=generate_default_points("#F72585", "#022C42"), shouldUseHslMerging=False),
        # orange
        ColorConfig(colorPoints=generate_default_points("#F72585", "#de875f"), shouldUseHslMerging=False),
        # brown
        ColorConfig(colorPoints=generate_default_points("#F72585", "#703801"), shouldUseHslMerging=False),
        # dark cyan
        ColorConfig(colorPoints=generate_default_points("#F72585", "#015270"), shouldUseHslMerging=False),
    ]
    GOLD_COLOR_CONFIGS = [
        # black
        ColorConfig(colorPoints=generate_default_points("#FFD700", "#000000"), shouldUseHslMerging=False),
    ]

    for tokenId, colorConfig in zip([1, 711, 3985, 6035, 6566, 8884], [GOLD_COLOR_CONFIGS[0], BLUE_COLOR_CONFIGS[0], PURPLE_COLOR_CONFIGS[0], LAVENDER_COLOR_CONFIGS[0], PINK_COLOR_CONFIGS[0], PINK_COLOR_CONFIGS[5]]):
        print(f'Generating {tokenId}')
        patternSvg = generate_svg(tokenId, colorConfig)
        with open(os.path.join('output', f"frame{tokenId}.svg"), 'w') as output:
            output.write(patternSvg)
        # cairosvg.svg2png(bytestring=patternSvg, write_to=os.path.join('output', f"frame{tokenId}.png"))
        # renderPM.drawToFile(svg2rlg(os.path.join('output', f"frame{tokenId}.svg"), os.path.join('output', f"frame{tokenId}.png"), fmt="PNG")
        subprocess.check_output(f'inkscape -w 1024 -h 1024 output/frame{tokenId}.svg -o output/frame{tokenId}.png', stderr=subprocess.STDOUT, shell=True)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')

[1,2,3,4,5,7,8,9,10,11,13,15,16,17,24,30,33,42,50,51,69,99,100,101,102,103,104,108,109,115,116,117,151,152,201,202,203,204,215,216,217,301,302,303,304,333,365,369,394,401,402,403,404,420,555,610,611,612,666,710,711,712,774,775,777,810,811,812,846,847,874,875,888,911,913,914,915,946,947,951,999,1000,1013,1014,1015,1024,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1113,1114,1115,1138,1139,1140,1141,1142,1143,1144,1145,1146,1147,1148,1149,1150,1151,1152,1153,1154,1155,1156,1157,1158,1159,1160,1161,1162,1238,1239,1240,1241,1242,1243,1244,1245,1246,1247,1248,1249,1250,1251,1252,1253,1254,1255,1256,1257,1258,1259,1260,1261,1262,1337,1338,1339,1340,1341,1342,1343,1344,1345,1346,1347,1348,1349,1350,1351,1352,1353,1354,1355,1356,1357,1358,1359,1360,1361,1362,1392,1438,1439,1440,1441,1442,1443,1444,1445,1446,1447,1448,1449,1450,1451,1452,1453,1454,1455,1456,1457,1458,1459,1460,1461,1462,1526,1527,1528,1529,1550,1551,1552,1553,1554,1580,1626,1627,1628,1629,1632,1650,1651,1652,1653,1654,1720,1726,1727,1728,1729,1750,1751,1752,1753,1754,1776,1786,1826,1827,1828,1829,1850,1851,1852,1853,1854,1872,1950,1951,1952,1953,1954,2000,2002,2012,2026,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2126,2138,2139,2140,2141,2142,2143,2144,2145,2146,2147,2148,2149,2150,2151,2152,2153,2154,2215,2216,2217,2226,2265,2326,2340,2401,2402,2426,2445,2450,2465,2466,2565,2566,2582,2616,2625,2682,2729,2730,2735,2737,2738,2739,2740,2745,2750,2751,2752,2753,2754,2755,2756,2757,2758,2771,2772,2773,2829,2830,2837,2838,2839,2840,2850,2851,2852,2853,2854,2855,2856,2857,2858,2871,2872,2873,2937,2938,2939,2940,2946,2950,2951,2952,2953,2954,2955,2956,2957,2958,2971,2972,2973,3000,3021,3029,3037,3038,3039,3040,3047,3048,3050,3051,3052,3053,3054,3055,3056,3057,3058,3067,3121,3137,3138,3141,3147,3148,3150,3151,3152,3153,3154,3157,3160,3229,3236,3237,3238,3245,3246,3250,3251,3252,3253,3254,3266,3267,3268,3269,3270,3271,3319,3320,3321,3322,3323,3333,3345,3346,3348,3349,3350,3351,3352,3353,3354,3366,3367,3368,3369,3370,3372,3403,3414,3419,3420,3421,3422,3423,3448,3449,3450,3452,3453,3454,3456,3459,3460,3461,3466,3467,3468,3469,3470,3503,3514,3519,3520,3521,3522,3523,3538,3539,3540,3541,3542,3543,3544,3545,3546,3547,3548,3549,3550,3552,3553,3554,3559,3560,3561,3566,3567,3568,3569,3570,3614,3619,3620,3621,3622,3623,3631,3632,3633,3634,3635,3636,3638,3639,3640,3641,3642,3643,3644,3645,3646,3647,3648,3649,3650,3651,3652,3653,3654,3655,3656,3659,3660,3661,3666,3667,3668,3669,3670,3714,3719,3720,3721,3722,3723,3727,3731,3732,3733,3734,3735,3736,3737,3738,3739,3740,3741,3742,3743,3744,3745,3746,3747,3748,3749,3750,3751,3752,3753,3754,3755,3756,3757,3758,3759,3760,3761,3762,3763,3766,3774,3779,3780,3814,3817,3831,3832,3833,3834,3835,3836,3837,3838,3839,3840,3841,3842,3843,3844,3845,3846,3847,3848,3849,3850,3851,3852,3853,3854,3855,3856,3857,3858,3859,3860,3861,3862,3863,3864,3879,3880,3885,3886,3914,3931,3932,3933,3934,3935,3936,3937,3938,3939,3940,3941,3942,3943,3944,3945,3946,3947,3948,3949,3950,3951,3952,3953,3954,3955,3956,3957,3958,3959,3960,3961,3962,3963,3964,3985,3986,4014,4031,4032,4033,4034,4035,4037,4063,4064,4114,4124,4129,4130,4131,4132,4133,4134,4135,4136,4137,4163,4164,4165,4167,4168,4214,4228,4229,4230,4231,4232,4233,4234,4235,4236,4237,4263,4264,4265,4267,4268,4269,4274,4275,4276,4285,4286,4287,4314,4319,4328,4329,4330,4331,4332,4333,4335,4336,4337,4363,4364,4365,4367,4368,4371,4385,4386,4387,4427,4428,4429,4430,4431,4432,4433,4436,4437,4463,4464,4465,4466,4485,4486,4487,4525,4526,4527,4528,4529,4530,4531,4532,4533,4534,4536,4537,4563,4564,4565,4566,4567,4568,4577,4622,4623,4624,4625,4626,4627,4628,4629,4630,4631,4632,4633,4634,4635,4636,4637,4663,4664,4665,4666,4667,4668,4669,4717,4718,4719,4722,4723,4724,4725,4726,4727,4728,4729,4730,4731,4732,4733,4734,4735,4736,4737,4763,4764,4765,4766,4767,4768,4773,4774,4817,4818,4822,4823,4824,4825,4826,4827,4828,4829,4830,4831,4832,4833,4834,4835,4836,4837,4863,4864,4865,4866,4867,4868,4873,4874,4922,4923,4924,4925,4926,4927,4928,4929,4930,4931,4932,4933,4934,4935,4936,4937,4963,4964,4965,4966,4968,4969,4970,4971,4972,4973,4974,4975,4989,5000,5008,5013,5014,5017,5022,5023,5024,5025,5026,5027,5028,5029,5030,5031,5032,5033,5034,5035,5036,5037,5063,5064,5065,5066,5067,5068,5069,5070,5071,5072,5073,5074,5090,5097,5113,5114,5125,5126,5129,5130,5131,5132,5133,5134,5135,5136,5137,5163,5164,5165,5166,5167,5168,5169,5170,5171,5172,5173,5174,5189,5225,5226,5229,5230,5231,5232,5233,5234,5235,5236,5237,5263,5264,5265,5266,5267,5268,5269,5270,5271,5272,5273,5274,5299,5329,5330,5331,5332,5333,5334,5335,5336,5337,5363,5364,5365,5368,5369,5370,5371,5372,5431,5432,5433,5434,5435,5436,5437,5463,5464,5465,5466,5467,5468,5469,5470,5471,5526,5531,5532,5533,5534,5535,5536,5537,5563,5564,5565,5566,5567,5568,5569,5570,5571,5575,5587,5622,5631,5632,5633,5634,5635,5636,5637,5663,5664,5665,5666,5667,5668,5669,5670,5694,5695,5731,5732,5733,5734,5735,5736,5737,5763,5764,5765,5766,5767,5768,5769,5793,5794,5795,5796,5811,5831,5832,5833,5834,5835,5836,5837,5863,5864,5865,5866,5867,5868,5869,5893,5894,5895,5896,5911,5927,5928,5933,5934,5935,5936,5937,5963,5964,5966,5967,5972,5993,5994,5995,5996,6011,6022,6027,6028,6033,6034,6035,6036,6037,6038,6039,6040,6041,6042,6043,6044,6045,6046,6047,6048,6049,6050,6051,6052,6053,6054,6055,6056,6057,6058,6059,6060,6061,6062,6063,6064,6066,6067,6079,6093,6094,6095,6096,6111,6127,6128,6132,6133,6134,6135,6136,6137,6138,6139,6140,6141,6142,6143,6144,6145,6146,6147,6148,6149,6150,6151,6152,6153,6154,6155,6156,6157,6158,6159,6160,6161,6163,6174,6193,6194,6195,6196,6211,6233,6234,6235,6236,6237,6240,6241,6243,6244,6245,6246,6247,6248,6249,6250,6251,6252,6253,6254,6255,6256,6257,6258,6259,6261,6262,6293,6294,6295,6296,6311,6333,6334,6335,6340,6341,6343,6344,6345,6346,6347,6348,6349,6350,6351,6352,6353,6354,6355,6356,6357,6358,6359,6361,6362,6365,6393,6394,6395,6396,6411,6433,6434,6435,6443,6444,6445,6446,6447,6448,6449,6450,6451,6452,6453,6454,6455,6456,6457,6458,6459,6460,6461,6462,6470,6493,6494,6495,6496,6511,6517,6518,6519,6520,6521,6522,6523,6524,6529,6539,6543,6544,6545,6546,6547,6548,6549,6550,6552,6553,6554,6555,6556,6557,6558,6559,6560,6561,6562,6611,6617,6618,6619,6620,6621,6622,6623,6624,6634,6643,6644,6645,6646,6647,6648,6649,6650,6652,6653,6654,6660,6661,6662,6666,6711,6717,6718,6719,6720,6721,6722,6723,6724,6729,6743,6744,6745,6746,6747,6748,6761,6817,6818,6819,6820,6821,6822,6823,6824,6834,6835,6836,6843,6844,6845,6846,6847,6848,6855,6934,6935,6942,6969,6973,6983,7050,7051,7061,7062,7083,7094,7132,7133,7134,7135,7150,7151,7161,7162,7232,7233,7234,7235,7332,7333,7334,7335,7432,7433,7434,7435,7487,7488,7515,7532,7533,7534,7535,7547,7585,7587,7588,7632,7633,7634,7635,7688,7761,7762,7763,7764,7765,7777,7861,7862,7863,7864,7865,7958,7959,7961,7962,7963,7964,7965,8037,8038,8039,8058,8059,8061,8062,8063,8064,8065,8137,8138,8139,8161,8162,8163,8164,8165,8214,8237,8238,8239,8386,8447,8627,8750,8760,8761,8762,8763,8797,8838,8839,8860,8861,8862,8863,8867,8868,8869,8870,8888,8911,8912,8938,8939,8943,8960,8961,8962,8963,8967,8968,8969,8970,9000,9042,9043,9044,9045,9060,9061,9062,9063,9142,9143,9144,9145,9177,9200,9242,9243,9244,9245,9301,9342,9343,9344,9345,9401,9480,9501,9538,9559,9601,9701,9743,9796,9797,9798,9896,9897,9898,9901,9950,9996,9997,9998,9999,10000]
