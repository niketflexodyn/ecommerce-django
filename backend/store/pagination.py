from rest_framework.pagination import PageNumberPagination


class ProductPagination(PageNumberPagination):
    page_size = 8         # Products per page
    page_size_query_param = "page_size"
    max_page_size = 50

    def paginate_queryset(self, queryset, request, view=None):
        """
        Clamp the requested page to a valid range instead of returning 404.

        The frontend resets to page 1 whenever filters/sort change, but a stale
        page number can still reach us in the same render pass. Returning the
        last available page (or an empty first page when there are no results)
        avoids a transient 404 error flash on the storefront.
        """
        page_size = self.get_page_size(request)
        if not page_size:
            return None

        paginator = self.django_paginator_class(queryset, page_size)
        page_number = self.get_page_number(request, paginator)
        # get_page_number can return a string depending on the DRF version;
        # coerce to int so the clamping comparisons below are type-safe.
        try:
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_number = 1

        total_pages = paginator.num_pages
        if total_pages == 0:
            page_number = 1
        else:
            page_number = max(1, min(page_number, total_pages))

        self.page = paginator.page(page_number)
        self.request = request
        return list(self.page)