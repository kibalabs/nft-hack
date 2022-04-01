import dataclasses
import math
import logging
import os
import random
from typing import Dict, List
import asyncclick as click

import cairosvg
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
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
    width = 75
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
    # Draw a dot where the token is
    # svg.rect(x=xCoord, y=yCoord, height=20, width=20, **{'fill': '#00ff00'})

    # Draw a dot on the ring representing the token
    starColor = '#ffffff'
    boxSize = 15
    angle = angle_between_points(centerX, centerY, xCoord, yCoord)
    xCoord = (math.cos(angle) * (innerDistance + ((outerDistance - innerDistance) / 2.0))) + centerX
    yCoord = (math.sin(angle) * (innerDistance + ((outerDistance - innerDistance) / 2.0))) + centerY
    boxTopLeftX = xCoord-boxSize/2
    boxTopLeftY = yCoord-boxSize/2
    svg.rect(x=boxTopLeftX+boxSize/4, y=boxTopLeftY+boxSize/4, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 1})
    svg.rect(x=boxTopLeftX, y=boxTopLeftY, height=boxSize, width=boxSize, **{'fill': starColor, 'opacity': 0.9})
    # shadow boxes
    firstShadowOffset = 3
    svg.rect(x=boxTopLeftX-firstShadowOffset, y=boxTopLeftY-firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    svg.rect(x=boxTopLeftX-firstShadowOffset, y=boxTopLeftY+boxSize/2+firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    svg.rect(x=boxTopLeftX+boxSize/2+firstShadowOffset, y=boxTopLeftY-firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    svg.rect(x=boxTopLeftX+boxSize/2+firstShadowOffset, y=boxTopLeftY+boxSize/2+firstShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.5, 'rx': 1})
    secondShadowOffset = 6
    svg.rect(x=boxTopLeftX-secondShadowOffset, y=boxTopLeftY-secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    svg.rect(x=boxTopLeftX-secondShadowOffset, y=boxTopLeftY+boxSize/2+secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    svg.rect(x=boxTopLeftX+boxSize/2+secondShadowOffset, y=boxTopLeftY-secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})
    svg.rect(x=boxTopLeftX+boxSize/2+secondShadowOffset, y=boxTopLeftY+boxSize/2+secondShadowOffset, height=boxSize/2, width=boxSize/2, **{'fill': starColor, 'opacity': 0.2, 'rx': 1})

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
        cairosvg.svg2png(bytestring=patternSvg, write_to=os.path.join('output', f"frame{tokenId}.png"))
        # renderPM.drawToFile(svg2rlg(os.path.join('output', f"frame{tokenId}.svg"), os.path.join('output', f"frame{tokenId}.png"), fmt="PNG")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
