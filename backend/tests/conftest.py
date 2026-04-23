import pytest


def pytest_collection_modifyitems(config, items):
    # Mark all async tests automatically
    for item in items:
        if "asyncio" in item.keywords:
            continue
