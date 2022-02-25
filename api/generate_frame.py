import math
import logging
import random
from typing import List
import asyncclick as click

import cairosvg
from colour import Color
from frame_util import Delaunator

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

def merge_colors(colors: List[str], factors: List[float]) -> str:
    output = Color()
    for color, factor in zip(colors, factors):
        color = Color(color)
        output.red += color.red * factor
        output.green += color.green * factor
        output.blue += color.blue * factor
    return output.get_hex()

def geo_triangles(seed: str):
    random.seed(seed)
    size = 1000
    width = 75
    svg = SVG()
    svg.width = size
    svg.height = size

    svg.circle(cx=size / 2.0, cy=size / 2.0, r=(size - width) / 2.0, **{'stroke': f'rgb({20}, {20}, {20})', 'stroke-width': width / 2.0, 'fill': 'rgba(0, 0, 0, 0)'})

    colorPoints = [
        {"x": 1.0 * size / 9.0, "y": 1.0 * size / 9.0, "color": "#f7fcf0"},
        {"x": 2.0 * size / 9.0, "y": 2.0 * size / 9.0, "color": "#e0f3db"},
        {"x": 3.0 * size / 9.0, "y": 3.0 * size / 9.0, "color": "#ccebc5"},
        {"x": 4.0 * size / 9.0, "y": 4.0 * size / 9.0, "color": "#a8ddb5"},
        {"x": 5.0 * size / 9.0, "y": 5.0 * size / 9.0, "color": "#7bccc4"},
        {"x": 6.0 * size / 9.0, "y": 6.0 * size / 9.0, "color": "#4eb3d3"},
        {"x": 7.0 * size / 9.0, "y": 7.0 * size / 9.0, "color": "#2b8cbe"},
        {"x": 8.0 * size / 9.0, "y": 8.0 * size / 9.0, "color": "#0868ac"},
        {"x": 9.0 * size / 9.0, "y": 9.0 * size / 9.0, "color": "#084081"},
    ]
    jitterOffset = 350
    edgePointCount = 100
    innerPointCount = 200
    points = []
    outerDistance = size / 2.0
    innerDistance = outerDistance - width
    for i in range(edgePointCount):
        angle = i / edgePointCount * math.pi * 2
        x = math.cos(angle) * innerDistance + size / 2.0
        y = math.sin(angle) * innerDistance + size / 2.0
        points.append([x, y])
        x = math.cos(angle) * outerDistance + size / 2.0
        y = math.sin(angle) * outerDistance + size / 2.0
        points.append([x, y])
    for i in range(innerPointCount):
        angle = random.random() * math.pi * 2
        distance = random.randint(innerDistance, outerDistance)
        x = math.cos(angle) * distance + size / 2.0
        y = math.sin(angle) * distance + size / 2.0
        points.append([x, y])

    d = Delaunator(points)
    for i in range(0, len(d.triangles), 3):
        p1x = points[d.triangles[i + 0]][0]
        p1y = points[d.triangles[i + 0]][1]
        p2x = points[d.triangles[i + 1]][0]
        p2y = points[d.triangles[i + 1]][1]
        p3x = points[d.triangles[i + 2]][0]
        p3y = points[d.triangles[i + 2]][1]
        centerX = centerY = size / 2.0
        triangleCenterPointX = (p1x + p2x + p3x) / 3.0
        triangleCenterPointY = (p1y + p2y + p3y) / 3.0
        triangleCenterDistance = distance_between_points(x1=triangleCenterPointX, x2=centerX, y1=triangleCenterPointY, y2=centerY)
        if triangleCenterDistance < (innerDistance - 1):
            continue
        triangleCenterPointX += (random.random() - 0.5) * jitterOffset
        triangleCenterPointY += (random.random() - 0.5) * jitterOffset
        colorDistances = [1.0 / distance_between_points(x1=triangleCenterPointX, y1=triangleCenterPointY, x2=colorPoint['x'], y2=colorPoint['y']) for colorPoint in colorPoints]
        print('colorDistances', colorDistances)
        colorDistanceSum = sum(colorDistances)
        print('colorDistanceSum', colorDistanceSum)
        colorFactors = [(colorDistance / colorDistanceSum) for colorDistance in colorDistances]
        print('colorFactors', colorFactors)
        color = merge_colors(colors=[colorPoint['color'] for colorPoint in colorPoints], factors=colorFactors)
        svg.polygon(f'{p1x},{p1y} {p2x},{p2y} {p3x},{p3y}', **{
            'opacity': 1,
            'fill': color,
            'stroke': color,
        })
    return svg.to_string()


@click.command()
async def run():
    patternSvg = geo_triangles('abc.')
    cairosvg.svg2png(bytestring=patternSvg, write_to="output.png")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
